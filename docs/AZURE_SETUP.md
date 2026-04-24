# Azure setup — krok za krokem

Tenhle dokument tě provede od „nemám Azure účet" až po „Terraform umí deployovat infra bez long-lived secrets v CI". Přibližný čas: 30–45 minut. Náklady v Azure: 0 Kč, dokud nespustíš `terraform apply` (a i pak je MVP nejnižší tier ~25–35 €/měs).

Region, se kterým počítáme: **West Europe** (Amsterdam).

## 1. Založení Azure účtu a subscription

1. Jdi na <https://azure.microsoft.com/free>. Klikni „Start free".
2. Přihlásíš se svým Microsoft účtem (osobní nebo firemní). Pokud máš oba, použij ten, který chceš mít jako vlastníka subscription.
3. Projdi registraci (telefon, platební karta — kreditka není čerpaná, slouží k ověření, 200 USD kreditu na 30 dní).
4. Po dokončení jsi v **Azure Portal** na <https://portal.azure.com>.

Co se vytvořilo:
- **Microsoft Entra tenant** (adresář uživatelů, dříve Azure AD).
- **Subscription** s jménem „Free Trial" nebo „Azure subscription 1". Později jí můžeš přejmenovat (Subscriptions → klikni na ni → Rename).

### Poznamenej si tyhle 3 ID (budeš je potřebovat):

```
Tenant ID         = v Portal → Entra ID → Overview → Tenant ID
Subscription ID   = v Portal → Subscriptions → tvoje sub → Subscription ID
Tenant primary domain = v Entra ID → Overview → Primary domain (něco jako tvejmejl.onmicrosoft.com)
```

## 2. Instalace Azure CLI lokálně

Na macOS:

```bash
brew install azure-cli
az login
az account show  # ověří, že jsi přihlášený
az account set --subscription "<SUBSCRIPTION_ID>"
```

Tohle použijeme jen pro ruční ověření a první bootstrapping (state storage pro Terraform). Do CI nebudeme `az login` používat — tam jede OIDC.

## 3. App Registration pro GitHub OIDC federaci

Místo ukládání client secretu do GitHub repa použijeme **federated credentials** — GitHub Actions se podepisuje Azure AD přímo podle repo/branch/environment jména, žádná hesla.

### 3a) Vytvoření App Registration

```bash
az ad app create --display-name "github-oidc-p4-spc"
```

Výstup má `id` (Object ID) a `appId` (Client ID). **Poznamenej si Client ID.**

### 3b) Vytvoření service principalu

```bash
az ad sp create --id <CLIENT_ID>
```

### 3c) Přiřazení role Contributor na subscription

```bash
az role assignment create \
  --assignee <CLIENT_ID> \
  --role Contributor \
  --scope /subscriptions/<SUBSCRIPTION_ID>
```

(Později roli zúžíme na konkrétní resource groupy, teď pro jednoduchost.)

### 3d) Federated credentials — pro dev environment

```bash
cat > /tmp/fed-dev.json <<EOF
{
  "name": "github-p4-spc-dev",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<GH_ORG>/<REPO_NAME>:environment:dev",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create \
  --id <CLIENT_ID> \
  --parameters /tmp/fed-dev.json
```

**Nahraď `<GH_ORG>/<REPO_NAME>`** za skutečné jméno tvého repa (např. `performance4/p4-spc`).

Volitelně přidej i pro `main` branch (pro non-environment workflows):

```bash
cat > /tmp/fed-main.json <<EOF
{
  "name": "github-p4-spc-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<GH_ORG>/<REPO_NAME>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

az ad app federated-credential create \
  --id <CLIENT_ID> \
  --parameters /tmp/fed-main.json
```

## 3e) Přiděl sám sobě Owner roli na subscription

Pokud jsi Global Admin v Entra tenantu, ale ne Owner subscription, potřebuješ Owner pro vytváření zdrojů (resource groups, storage accounts atd.). Elevate Access dal jen User Access Administrator, což stačí na přidělování rolí, ale ne na vytváření zdrojů.

1. Zapni **Elevate Access** znovu (Portal → Entra ID → Properties → Access management for Azure resources = Yes).
2. Obnov token: `az logout && az login`.
3. Přiděl sobě Owner:

```bash
az role assignment create \
  --assignee <YOUR_UPN> \
  --role Owner \
  --scope /subscriptions/<SUBSCRIPTION_ID>
```

4. Vypni Elevate Access (Portal → ... = No).
5. Znovu `az logout && az login`.
6. Ověř: `az role assignment list --assignee <YOUR_UPN> --scope /subscriptions/<SUBSCRIPTION_ID> --output table`.

## 4. Terraform state storage

Terraform ukládá state někam — v Azure to je Storage Account + Blob Container. Udělej jednorázově ručně:

```bash
# Promenné
RG_NAME="rg-p4-spc-tfstate"
LOCATION="westeurope"
STORAGE_ACCOUNT="p4spctfstate$(openssl rand -hex 3)"  # musí být globálně unikátní
CONTAINER_NAME="tfstate"

az group create --name $RG_NAME --location $LOCATION

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RG_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --encryption-services blob \
  --allow-blob-public-access false \
  --min-tls-version TLS1_2 \
  --https-only true

az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login

echo "Storage account name: $STORAGE_ACCOUNT"
```

**Poznamenej si `$STORAGE_ACCOUNT`** — jde do Terraform backend configu.

## 5. GitHub repo — secrets a environment

V GitHub repu (`<GH_ORG>/<REPO_NAME>`) → Settings:

### 5a) Repository secrets (Settings → Secrets and variables → Actions)

| Název | Hodnota |
|---|---|
| `AZURE_CLIENT_ID` | Client ID z kroku 3a |
| `AZURE_TENANT_ID` | Tenant ID z kroku 1 |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID z kroku 1 |
| `TF_STATE_RG` | `rg-p4-spc-tfstate` |
| `TF_STATE_STORAGE_ACCOUNT` | hodnota `$STORAGE_ACCOUNT` z kroku 4 |
| `TF_STATE_CONTAINER` | `tfstate` |

### 5b) Environment „dev" (Settings → Environments → New environment)

- Vytvoř environment `dev`.
- Protected: ne (dev má běžet automaticky z `main`).
- Secrets zde nemusíme duplikovat, repo secrets stačí.

Až přidáš prod:
- Environment `prod` s **Required reviewers** (přidej sám sebe) — `terraform apply` v prod pak vyžaduje tvoje schválení v GH UI.

## 6. Doména (volitelné, lze doplnit později)

Pro dev environment není nutná vlastní doména — Container Apps dá default `*.azurecontainerapps.io` s TLS zdarma. Pro demo klientovi raději vlastní:

1. Kup doménu (např. `p4-spc.com`, `performance4.cz`) na registraru podle tvojí volby.
2. Přidej Azure DNS zónu: `az network dns zone create -g rg-p4-spc-prod-weu -n p4-spc.com` (udělá později Terraform).
3. U registrara změň name servers na Azure DNS (4 NS records).

## 7. Email service (Postmark)

Pro transakční emaily (password reset, notifikace):

1. <https://postmarkapp.com> — registrace zdarma, první měsíc 100 emailů zdarma.
2. Ověř odesílací doménu (SPF + DKIM TXT záznamy).
3. Vygeneruj **Server API Token** — uložíš jako `POSTMARK_TOKEN` do Key Vaultu (až ho Terraform postaví).

Lokálně řeší vše Mailhog (`localhost:8025`), takže tohle je pro cloud.

## 8. Kontrolní seznam

Po dokončení bys měl mít:

- [ ] Azure subscription aktivní, víš tenant/subscription ID
- [ ] `az login` funguje lokálně
- [ ] App Registration `github-oidc-p4-spc` existuje
- [ ] Service principal má roli `Contributor` na subscription
- [ ] Federated credential pro `environment:dev` i (volitelně) `ref:refs/heads/main`
- [ ] Storage account pro Terraform state existuje
- [ ] GitHub repo má všechny secrets a environment `dev`

Pak můžeš pokračovat spuštěním Terraformu (přijde v dalším kroku projektu).

## Troubleshooting

**`az login` v macOS otevře prohlížeč, ale pak vrací chybu.**
Zkus `az login --use-device-code` — zadáš kód na <https://microsoft.com/devicelogin>.

**Chyba „AuthorizationFailed" při `az role assignment create`.**
Tvůj účet má Contributor roli, ale ne Owner ani User Access Administrator (Contributor nemůže přiřazovat role). Diagnóza:

```bash
# Jaké role na subscription máš:
az role assignment list \
  --assignee <your-upn> \
  --scope /subscriptions/<SUBSCRIPTION_ID> \
  --output table

# Kdo je Owner:
az role assignment list \
  --role Owner \
  --scope /subscriptions/<SUBSCRIPTION_ID> \
  --output table
```

Řešení podle situace:

1. **Jsi Global Admin tenantu, ale ne Owner subscription** — použij Azure „Elevate Access":
   - Portal → Microsoft Entra ID → Properties → **Access management for Azure resources** = **Yes**, Save.
   - `az logout && az login` (token musí obnovit).
   - Spusť `az role assignment create` znovu.
   - Portal → Entra ID → Properties → přepni zpátky na **No** (bezpečnostní hygiena).

2. **Nejsi Global Admin** — zkontaktuj IT admina Performance4, který subscription vlastní, ať ti přidá Owner roli nebo zadá příkaz sám.

3. **Jsi v corporate tenantu bez přístupu** — vytvoř osobní subscription v jiném Microsoft účtu.

**App Registration nelze najít přes GUI.**
Entra ID → App registrations → přepni na „All applications" (není default).

**Chyba v GitHub Actions „AADSTS700016: Application with identifier … was not found".**
Federated credential má špatný `subject`. Musí přesně odpovídat `repo:<org>/<repo>:environment:<env>` (case sensitive, pomlčka místo lomítka kde jsou).

## Co dál

Jakmile je tohle hotové, dej vědět. Napíšu Terraform (`infra/`), CI workflow a můžeme nasadit první dev environment.
