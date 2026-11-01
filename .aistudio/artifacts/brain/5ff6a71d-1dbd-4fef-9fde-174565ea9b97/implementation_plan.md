# GitHub Remote Synchronization & Push Workflow

Push the container's committed codebase—including the 4-State Secular Trend indicator, Renko ATR charts, and GitHub Actions Pages deployment pipeline—directly to the remote GitHub repository (`https://github.com/SanthoshSkills/invest.git`) on branch `geminigoofups` (and `main` if desired) using an authenticated Git push.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Confirmed Sync Method**: Direct authenticated `git push` executed from the container environment using a GitHub Personal Access Token (PAT).
> - **Branch Target**: `geminigoofups` (currently holding commit `7fbdfa2`). Can also fast-forward or push to `main` to trigger the automated GitHub Pages deployment workflow.
> - **Credential Safety**: The token will be passed securely to the push command without persisting it to `.git/config`, repository files, or shell history.

---

## 1. Overview & Core Concept

- **What It Does**: Transmits all local commits from this isolated cloud container directly to GitHub. Once pushed to GitHub, the `.github/workflows/deploy.yml` pipeline will automatically trigger, build the project with Vite, and publish it live to GitHub Pages (`https://santhoshskills.github.io/invest/`).
- **Target Audience**: Repository owner (`SanthoshSkills`) looking to see the changes live on GitHub and GitHub Pages.
- **Key Value**: Resolves the GitHub Pages 404 error by ensuring the repository contains the build workflow and source code.

---

## 2. Synchronization & Deployment Workflow

```
┌────────────────────────┐         git push          ┌────────────────────────┐
│  AI Studio Container   │ ────────────────────────> │      GitHub Repo       │
│  Branch: geminigoofups │   (via GitHub PAT)        │ SanthoshSkills/invest  │
│  Commit: 7fbdfa2       │                           └───────────┬────────────┘
└────────────────────────┘                                       │
                                                     Triggers Actions Workflow
                                                                 │
                                                                 ▼
                                                     ┌────────────────────────┐
                                                     │      GitHub Pages      │
                                                     │ santhoshskills.github  │
                                                     │       .io/invest/      │
                                                     └────────────────────────┘
```

### Steps to Complete Upon Approval:
1. **Request / Receive Token**: Prompt user to provide their GitHub PAT (with `repo` / `workflow` permissions).
2. **Execute Authenticated Push**:
   - Run `git push https://<token>@github.com/SanthoshSkills/invest.git geminigoofups`
   - Optionally push to `main` if the user wants immediate deployment to their default branch:
     `git push https://<token>@github.com/SanthoshSkills/invest.git geminigoofups:main`
3. **Trigger GitHub Actions & Verify Deployment**:
   - Verify push success on GitHub.
   - Instruct user to verify the GitHub Actions run under `https://github.com/SanthoshSkills/invest/actions`.
   - GitHub Pages URL `https://santhoshskills.github.io/invest/` will become active as soon as the workflow completes.

---

## 3. Key Decisions & Alternatives

- **Decision 1: Authenticated Push vs. Local Git Pull**:
  - *Chosen*: Outbound push from the container using user's GitHub PAT.
  - *Why*: The cloud container does not have an open public SSH/HTTP port for inbound pulling from external machines. Outbound push is immediate, reliable, and keeps all git history intact.
- **Decision 2: Token Security**:
  - *Chosen*: Use an ephemeral push command URL without storing the token in `.git/config` or any checked-in project files.
  - *Why*: Guarantees zero credential leakage in commits or environment configuration.

---

## 4. Technical Architecture & Git State

- **Current Git Branch**: `geminigoofups`
- **Head Commit**: `7fbdfa2` (`feat: complete secular trend indicator, renko ATR charts, and github pages deployment workflow`)
- **Remote Origin**: `https://github.com/SanthoshSkills/invest.git`
- **Workflow File**: `.github/workflows/deploy.yml` (Configured with Vite build, relative base `/invest/`, and `actions/deploy-pages@v4`)
