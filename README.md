# 🚀 Sistema de Controle de Versões

Sistema web moderno para gerenciamento de versões, módulos e clientes, construído com Next.js 15 e Supabase.

## 📋 Sobre o Projeto

Este sistema oferece uma interface intuitiva para controle de versões de software, com recursos avançados de gerenciamento de módulos, clientes e relatórios. Desenvolvido com as melhores práticas de desenvolvimento web moderno.

## ✨ Funcionalidades

- [x] Sistema de autenticação completo
- [x] Gerenciamento de módulos e versões
- [x] Controle de clientes e permissões
- [x] Dashboard com métricas e relatórios
- [x] Interface responsiva e moderna
- [x] Integração completa com Supabase

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+ 
- NPM ou Yarn
- Conta no Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Noronhajr13/version-control.git

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute em desenvolvimento
npm run dev
```

## 📚 Documentação

A documentação completa está organizada na pasta [`docs/`](./docs/):

- **[Setup](./docs/setup/)** - Configuração inicial do projeto
  - [Database Setup](./docs/setup/database-setup.md) - Configuração do Supabase
  - [Email Confirmation](./docs/setup/email-confirmation.md) - Setup de confirmação de email
  - [Workflow](./docs/setup/workflow.md) - Fluxo de trabalho Git

- **[Development](./docs/development/)** - Documentação de desenvolvimento
  - [Migration AuthContext](./docs/development/migration-authcontext.md) - Sistema de autenticação
  - [Error Reports](./docs/development/error-reports.md) - Soluções para problemas comuns

- **[Dev Tools](./dev/)** - Ferramentas de desenvolvimento e debug

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
