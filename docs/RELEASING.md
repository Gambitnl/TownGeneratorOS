# Gemini CLI Releases

## Release Cadence and Tags

This project has adopted and adheres to Semantic Versioning 2.0.0 (https://semver.org/). Our weekly releases will be minor version increments and any bug or hotfixes between releases will go out as patch versions on the most recent release.

Each Tuesaday ~2000 UTC new Stable and Preview releases will be cut. The promotion flow is:

- Code is commited to main and pushed each night to nightly
- After no more than 1 week on main, code is promoted to the `preview` channel
- After 1 week the most recent `preview` channel is promoted to `stable` cannel
- Patch fixes will be produced against both `preview` and `stable` as needed, with the final 'patch' version number incrementing each time.

### Preview

These releases will not have been fully vetted and may contain regressions or other outstanding issues. Please help us test and install with `preview` tag.

```bash
npm install -g @google/gemini-cli@preview
```

### Stable

This will be the full promotion of last week's release + any bug fixes and validations. Use `latest` tag.

```bash
npm install -g @google/gemini-cli@latest
```

### Nightly

- New releases will be published each day at UTC 0000. This will be all changes from the main branch as represented at time of release. It should be assumed there are pending validations and issues. Use `nightly` tag.

```bash
npm install -g @google/gemini-cli@nightly
```

## Weekly Release Promotion

Each Tuesday, the on-call engineer will trigger the "Promote Release" workflow. This single action automates the entire weekly release process:

1.  **Promotes Preview to Stable:** The workflow identifies the latest `preview` release and promotes it to `stable`. This becomes the new `latest` version on npm.
2.  **Promotes Nightly to Preview:** The latest `nightly` release is then promoted to become the new `preview` version.
3.  **Prepares for next Nightly:** A pull request is automatically created and merged to bump the version in `main` in preparation for the next nightly release.

This process ensures a consistent and reliable release cadence with minimal manual intervention.

### Source of Truth for Versioning

To ensure the highest reliability, the release promotion process uses the **NPM registry as the single source of truth** for determining the current version of each release channel (`stable`, `preview`, and `nightly`).

1.  **Fetch from NPM:** The workflow begins by querying NPM's `dist-tags` (`latest`, `preview`, `nightly`) to get the exact version strings for the packages currently available to users.
2.  **Cross-Check for Integrity:** For each version retrieved from NPM, the workflow performs a critical integrity check:
    - It verifies that a corresponding **git tag** exists in the repository.
    - It verifies that a corresponding **GitHub Release** has been created.
3.  **Halt on Discrepancy:** If either the git tag or the GitHub Release is missing for a version listed on NPM, the workflow will immediately fail. This strict check prevents promotions from a broken or incomplete previous release and alerts the on-call engineer to a release state inconsistency that must be manually resolved.
4.  **Calculate Next Version:** Only after these checks pass does the workflow proceed to calculate the next semantic version based on the trusted version numbers retrieved from NPM.

This NPM-first approach, backed by integrity checks, makes the release process highly robust and prevents the kinds of versioning discrepancies that can arise from relying solely on git history or API outputs.

## Manual Releases

For situations requiring a release outside of the regular nightly and weekly promotion schedule, and NOT already covered by patching process, you can use the `Release: Manual` workflow. This workflow provides a direct way to publish a specific version from any branch, tag, or commit SHA.

### How to Create a Manual Release

1.  Navigate to the **Actions** tab of the repository.
2.  Select the **Release: Manual** workflow from the list.
3.  Click the **Run workflow** dropdown button.
4.  Fill in the required inputs:
    - **Version**: The exact version to release (e.g., `v0.6.1`). This must be a valid semantic version with a `v` prefix.
    - **Ref**: The branch, tag, or full commit SHA to release from.
    - **NPM Channel**: The npm channel to publish to. The options are `preview`, `nightly`, `latest` (for stable releases), and `dev`. The default is `dev`.
    - **Dry Run**: Leave as `true` to run all steps without publishing, or set to `false` to perform a live release.
    - **Force Skip Tests**: Set to `true` to skip the test suite. This is not recommended for production releases.
    - **Skip GitHub Release**: Set to `true` to skip creating a GitHub release and create an npm release only.
5.  Click **Run workflow**.

The workflow will then proceed to test (if not skipped), build, and publish the release. If the workflow fails during a non-dry run, it will automatically create a GitHub issue with the failure details.

## Rollback/Rollforward

In the event that a release has a critical regression, you can quickly roll back to a previous stable version or roll forward to a new patch by changing the npm `dist-tag`. The `Release: Change Tags` workflow provides a safe and controlled way to do this.

This is the preferred method for both rollbacks and rollforwards, as it does not require a full release cycle.

### How to Change a Release Tag

1.  Navigate to the **Actions** tab of the repository.
2.  Select the **Release: Change Tags** workflow from the list.
3.  Click the **Run workflow** dropdown button.
4.  Fill in the required inputs:
    - **Version**: The existing package version that you want to point the tag to (e.g., `0.5.0-preview-2`). This version **must** already be published to the npm registry.
    - **Channel**: The npm `dist-tag` to apply (e.g., `preview`, `stable`).
    - **Dry Run**: Leave as `true` to log the action without making changes, or set to `false` to perform the live tag change.
5.  Click **Run workflow**.

The workflow will then run `npm dist-tag add` for both the `@google/gemini-cli` and `@google/gemini-cli-core` packages, pointing the specified channel to the specified version.

## Patching

If a critical bug that is already fixed on `main` needs to be patched on a `stable` or `preview` release, the process is now highly automated.

### How to Patch

#### 1. Create the Patch Pull Request

There are two ways to create a patch pull request:

**Option A: From a GitHub Comment (Recommended)**

After a pull request containing the fix has been merged, a maintainer can add a comment on that same PR with the following format:

`/patch [channel]`

- **channel** (optional):
  - _no channel_ - patches both stable and preview channels (default, recommended for most fixes)
  - `both` - patches both stable and preview channels (same as default)
  - `stable` - patches only the stable channel
  - `preview` - patches only the preview channel

Examples:

- `/patch` (patches both stable and preview - default)
- `/patch both` (patches both stable and preview - explicit)
- `/patch stable` (patches only stable)
- `/patch preview` (patches only preview)

The `Release: Patch from Comment` workflow will automatically find the merge commit SHA and trigger the `Release: Patch (1) Create PR` workflow. If the PR is not yet merged, it will post a comment indicating the failure.

**Option B: Manually Triggering the Workflow**

Navigate to the **Actions** tab and run the **Release: Patch (1) Create PR** workflow.

- **Commit**: The full SHA of the commit on `main` that you want to cherry-pick.
- **Channel**: The channel you want to patch (`stable` or `preview`).

This workflow will automatically:

1.  Find the latest release tag for the channel.
2.  Create a release branch from that tag if one doesn't exist (e.g., `release/v0.5.1`).
3.  Create a new hotfix branch from the release branch.
4.  Cherry-pick your specified commit into the hotfix branch.
5.  Create a pull request from the hotfix branch back to the release branch.

#### 2. Review and Merge

Review the automatically created pull request(s) to ensure the cherry-pick was successful and the changes are correct. Once approved, merge the pull request.

**Security Note:** The `release/*` branches are protected by branch protection rules. A pull request to one of these branches requires at least one review from a code owner before it can be merged. This ensures that no unauthorized code is released.

#### 2.5. Adding Multiple Commits to a Hotfix (Advanced)

If you need to include multiple fixes in a single patch release, you can add additional commits to the hotfix branch after the initial patch PR has been created:

1. **Start with the primary fix**: Use `/patch` (or `/patch both`) on the most important PR to create the initial hotfix branch and PR.

2. **Checkout the hotfix branch locally**:

   ```bash
   git fetch origin
   git checkout hotfix/v0.5.1/stable/cherry-pick-abc1234  # Use the actual branch name from the PR
   ```

3. **Cherry-pick additional commits**:

   ```bash
   git cherry-pick &lt;commit-sha-1&gt;
   git cherry-pick &lt;commit-sha-2&gt;
   # Add as many commits as needed
   ```

4. **Push the updated branch**:

   ```bash
   git push origin hotfix/v0.5.1/stable/cherry-pick-abc1234
   ```

5. **Test and review**: The existing patch PR will automatically update with your additional commits. Test thoroughly since you're now releasing multiple changes together.

6. **Update the PR description**: Consider updating the PR title and description to reflect that it includes multiple fixes.

This approach allows you to group related fixes into a single patch release while maintaining full control over what gets included and how conflicts are resolved.

#### 3. Automatic Release

Upon merging the pull request, the `Release: Patch (2) Trigger` workflow is automatically triggered. It will then start the `Release: Patch (3) Release` workflow, which will:

1.  Build and test the patched code.
2.  Publish the new patch version to npm.
3.  Create a new GitHub release with the patch notes.

This fully automated process ensures that patches are created and released consistently and reliably.

#### Troubleshooting: Older Branch Workflows

**Issue**: If the patch trigger workflow fails with errors like "Resource not accessible by integration" or references to non-existent workflow files (e.g., `patch-release.yml`), this indicates the hotfix branch contains an outdated version of the workflow files.

**Root Cause**: When a PR is merged, GitHub Actions runs the workflow definition from the **source branch** (the hotfix branch), not from the target branch (the release branch). If the hotfix branch was created from an older release branch that predates workflow improvements, it will use the old workflow logic.

**Solutions**:

**Option 1: Manual Trigger (Quick Fix)**
Manually trigger the updated workflow from the branch with the latest workflow code:

```bash
# For a preview channel patch with tests skipped
gh workflow run release-patch-2-trigger.yml --ref &lt;branch-with-updated-workflow&gt; \
  --field ref="hotfix/v0.6.0-preview.2/preview/cherry-pick-abc1234" \
  --field workflow_ref=&lt;branch-with-updated-workflow&gt; \
  --field dry_run=false \
  --field force_skip_tests=true

# For a stable channel patch
gh workflow run release-patch-2-trigger.yml --ref &lt;branch-with-updated-workflow&gt; \
  --field ref="hotfix/v0.5.1/stable/cherry-pick-abc1234" \
  --field workflow_ref=&lt;branch-with-updated-workflow&gt; \
  --field dry_run=false \
  --field force_skip_tests=false

# Example using main branch (most common case)
gh workflow run release-patch-2-trigger.yml --ref main \
  --field ref="hotfix/v0.6.0-preview.2/preview/cherry-pick-abc1234" \
  --field workflow_ref=main \
  --field dry_run=false \
  --field force_skip_tests=true
```

**Note**: Replace `&lt;branch-with-updated-workflow&gt;` with the branch containing the latest workflow improvements (usually `main`, but could be a feature branch if testing updates).

**Option 2: Update the Hotfix Branch**
Merge the latest main branch into your hotfix branch to get the updated workflows:

```bash
git checkout hotfix/v0.6.0-preview.2/preview/cherry-pick-abc1234
git merge main
git push
```

Then close and reopen the PR to retrigger the workflow with the updated version.

**Option 3: Direct Release Trigger**
Skip the trigger workflow entirely and directly run the release workflow:

```bash
# Replace channel and release_ref with appropriate values
gh workflow run release-patch-3-release.yml --ref main \
  --field type="preview" \
  --field dry_run=false \
  --field force_skip_tests=true \
  --field release_ref="release/v0.6.0-preview.2"
```

### Docker

We also run a Google cloud build called [release-docker.yml](../.gcp/release-docker.yml). Which publishes the sandbox docker to match your release. This will also be moved to GH and combined with the main release file once service account permissions are sorted out.

## Release Validation

After pushing a new release smoke testing should be performed to ensure that the packages are working as expected. This can be done by installing the packages locally and running a set of tests to ensure that they are functioning correctly.

- `npx -y @google/gemini-cli@latest --version` to validate the push worked as expected if you were not doing a rc or dev tag
- `npx -y @google/gemini-cli@&lt;release tag&gt; --version` to validate the tag pushed appropriately
- _This is destructive locally_ `npm uninstall @google/gemini-cli && npm uninstall -g @google/gemini-cli && npm cache clean --force &&  npm install @google/gemini-cli@&lt;version&gt;`
- Smoke testing a basic run through of exercising a few llm commands and tools is recommended to ensure that the packages are working as expected. We'll codify this more in the future.

## Local Testing and Validation: Changes to the Packaging and Publishing Process

If you need to test the release process without actually publishing to NPM or creating a public GitHub release, you can trigger the workflow manually from the GitHub UI.

1.  Go to the [Actions tab](https://github.com/google-gemini/gemini-cli/actions/workflows/release-manual.yml) of the repository.
2.  Click on the "Run workflow" dropdown.
3.  Leave the `dry_run` option checked (`true`).
4.  Click the "Run workflow" button.

This will run the entire release process but will skip the `npm publish` and `gh release create` steps. You can inspect the workflow logs to ensure everything is working as expected.

It is crucial to test any changes to the packaging and publishing process locally before committing them. This ensures that the packages will be published correctly and that they will work as expected when installed by a user.

To validate your changes, you can perform a dry run of the publishing process. This will simulate the publishing process without actually publishing the packages to the npm registry.

```bash
npm_package_version=9.9.9 SANDBOX_IMAGE_REGISTRY="registry" SANDBOX_IMAGE_NAME="thename" npm run publish:npm --dry-run
```

This command will do the following:

1.  Build all the packages.
2.  Run all the prepublish scripts.
3.  Create the package tarballs that would be published to npm.
4.  Print a summary of the packages that would be published.

You can then inspect the generated tarballs to ensure that they contain the correct files and that the `package.json` files have been updated correctly. The tarballs will be created in the root of each package's directory (e.g., `packages/cli/google-gemini-cli-0.1.6.tgz`).

By performing a dry run, you can be confident that your changes to the packaging process are correct and that the packages will be published successfully.

## Release Deep Dive

The release process creates two distinct types of artifacts for different distribution channels: standard packages for the NPM registry and a single, self-contained executable for GitHub Releases.

Here are the key stages:

**Stage 1: Pre-Release Sanity Checks and Versioning**

- **What happens:** Before any files are moved, the process ensures the project is in a good state. This involves running tests, linting, and type-checking (`npm run preflight`). The version number in the root `package.json` and `packages/cli/package.json` is updated to the new release version.

**Stage 2: Building the Source Code for NPM**

- **What happens:** The TypeScript source code in `packages/core/src` and `packages/cli/src` is compiled into standard JavaScript.
- **File movement:**
  - `packages/core/src/**/*.ts` -&gt; compiled to -&gt; `packages/core/dist/`
  - `packages/cli/src/**/*.ts` -&gt; compiled to -&gt; `packages/cli/dist/`
- **Why:** The TypeScript code written during development needs to be converted into plain JavaScript that can be run by Node.js. The `core` package is built first as the `cli` package depends on it.

**Stage 3: Publishing Standard Packages to NPM**

- **What happens:** The `npm publish` command is run for the `@google/gemini-cli-core` and `@google/gemini-cli` packages.
- **Why:** This publishes them as standard Node.js packages. Users installing via `npm install -g @google/gemini-cli` will download these packages, and `npm` will handle installing the `@google/gemini-cli-core` dependency automatically. The code in these packages is not bundled into a single file.

**Stage 4: Assembling and Creating the GitHub Release Asset**

This stage happens _after_ the NPM publish and creates the single-file executable that enables `npx` usage directly from the GitHub repository.

1.  **The JavaScript Bundle is Created:**
    - **What happens:** The built JavaScript from both `packages/core/dist` and `packages/cli/dist`, along with all third-party JavaScript dependencies, are bundled by `esbuild` into a single, executable JavaScript file (e.g., `gemini.js`). The `node-pty` library is excluded from this bundle as it contains native binaries.
    - **Why:** This creates a single, optimized file that contains all the necessary application code. It simplifies execution for users who want to run the CLI without a full `npm install`, as all dependencies (including the `core` package) are included directly.

2.  **The `bundle` Directory is Assembled:**
    - **What happens:** A temporary `bundle` folder is created at the project root. The single `gemini.js` executable is placed inside it, along with other essential files.
    - **File movement:**
      - `gemini.js` (from esbuild) -&gt; `bundle/gemini.js`
      - `README.md` -&gt; `bundle/README.md`
      - `LICENSE` -&gt; `bundle/LICENSE`
      - `packages/cli/src/utils/*.sb` (sandbox profiles) -&gt; `bundle/`
    - **Why:** This creates a clean, self-contained directory with everything needed to run the CLI and understand its license and usage.

3.  **The GitHub Release is Created:**
    - **What happens:** The contents of the `bundle` directory, including the `gemini.js` executable, are attached as assets to a new GitHub Release.
    - **Why:** This makes the single-file version of the CLI available for direct download and enables the `npx https://github.com/google-gemini/gemini-cli` command, which downloads and runs this specific bundled asset.

**Summary of Artifacts**

- **NPM:** Publishes standard, un-bundled Node.js packages. The primary artifact is the code in `packages/cli/dist`, which depends on `@google/gemini-cli-core`.
- **GitHub Release:** Publishes a single, bundled `gemini.js` file that contains all dependencies, for easy execution via `npx`.

This dual-artifact process ensures that both traditional `npm` users and those who prefer the convenience of `npx` have an optimized experience.

## Notifications

Failing release workflows will automatically create an issue with the label
`release-failure`.

A notification will be posted to the maintainer's chat channel when issues with
this type are created.

### Modifying chat notifications

Notifications use [GitHub for Google Chat](https://workspace.google.com/marketplace/app/github_for_google_chat/536184076190). To modify the notifications, use `/github-settings` within the chat space.

&gt; [!WARNING]
&gt; The following instructions describe a fragile workaround that depends on the internal structure of the chat application's UI. It is likely to break with future updates.

The list of available labels is not currently populated correctly. If you want to add a label that does not appear alphabetically in the first 30 labels in the repo, you must use your browser's developer tools to manually modify the UI:

1. Open your browser's developer tools (e.g., Chrome DevTools).
2. In the `/github-settings` dialog, inspect the list of labels.
3. Locate one of the `<li>` elements representing a label.
4. In the HTML, modify the `data-option-value` attribute of that `<li>` element to the desired label name (e.g., `release-failure`).
5. Click on your modified label in the UI to select it, then save your settings.

Current chat notifications are configured for the following events:

- Issues
- Pull Requests
- Commits
- Releases
- Actions
- Deployments
- Discussions
- Comments
- Branch & Tag Creation / Deletion
- Stars
- Forks
- Security Advisories
- Wiki
- Repository
- Public
- Sponsorship
- Custom events
- All events

The following labels are included in notifications:

- `release-failure`
- `bug`
- `critical`
- `documentation`
- `enhancement`
- `good first issue`
- `help wanted`
- `question`
- `wontfix`
- `invalid`
- `duplicate`
- `dependencies`
- `security`
- `testing`
- `workflow`
- `stale`
- `needs-repro`
- `needs-triage`
- `needs-discussion`
- `needs-design`
- `needs-implementation`
- `needs-review`
- `needs-testing`
- `needs-documentation`
- `needs-release`
- `needs-attention`
- `blocked`
- `in-progress`
- `done`
- `wip`
- `on-hold`
- `archived`
- `backlog`
- `icebox`
- `epic`
- `story`
- `task`
- `sub-task`
- `bug-report`
- `feature-request`
- `improvement`
- `refactor`
- `style`
- `chore`
- `build`
- `ci`
- `cd`
- `test`
- `docs`
- `perf`
- `revert`
- `release`
- `hotfix`
- `security-vulnerability`
- `dependency-update`
- `breaking-change`
- `deprecation`
- `accessibility`
- `internationalization`
- `localization`
- `seo`
- `analytics`
- `design`
- `ux`
- `ui`
- `copy`
- `content`
- `marketing`
- `sales`
- `support`
- `legal`
- `privacy`
- `security-policy`
- `code-of-conduct`
- `contributing`
- `license`
- `readme`
- `issue-template`
- `pull-request-template`
- `codeowners`
- `dependabot`
- `github-actions`
- `github-pages`
- `github-sponsors`
- `github-discussions`
- `github-issues`
- `github-pull-requests`
- `github-projects`
- `github-releases`
- `github-security`
- `github-wiki`
- `github`
- `community`
- `hacktoberfest`
- `good-first-pr`
- `first-timers-only`
- `up-for-grabs`
- `low-hanging-fruit`
- `easy`
- `medium`
- `hard`
- `effort1`
- `effort2`
- `effort3`
- `effort4`
- `effort5`
- `priority1`
- `priority2`
- `priority3`
- `priority4`
- `priority5`
- `size-xs`
- `size-s`
- `size-m`
- `size-l`
- `size-xl`
- `size-xxl`
- `t-shirt-s`
- `t-shirt-m`
- `t-shirt-l`
- `t-shirt-xl`
- `t-shirt-xxl`
- `area-api`
- `area-cli`
- `area-core`
- `area-docs`
- `area-examples`
- `area-infra`
- `area-tests`
- `area-website`
- `platform-android`
- `platform-ios`
- `platform-web`
- `platform-windows`
- `platform-macos`
- `platform-linux`
- `platform-node`
- `platform-deno`
- `platform-bun`
- `platform-electron`
- `platform-react-native`
- `platform-flutter`
- `platform-unity`
- `platform-unreal`
- `platform-godot`
- `platform-roblox`
- `platform-vscode`
- `platform-figma`
- `platform-sketch`
- `platform-xd`
- `platform-photoshop`
- `platform-illustrator`
- `platform-indesign`
- `platform-premiere`
- `platform-after-effects`
- `platform-audition`
- `platform-lightroom`
- `platform-dreamweaver`
- `platform-animate`
- `platform-character-animator`
- `platform-dimension`
- `platform-fuse`
- `platform-invision`
- `platform-framer`
- `platform-zeplin`
- `platform-abstract`
- `platform-gallery`
- `platform-storybook`
- `platform-bit`
- `platform-chromatic`
- `platform-percy`
- `platform-happo`
- `platform-applitools`
- `platform-saucelabs`
- `platform-browserstack`
- `platform-testing-library`
- `platform-cypress`
- `platform-playwright`
- `platform-puppeteer`
- `platform-selenium`
- `platform-webdriverio`
- `platform-testcafe`
- `platform-jest`
- `platform-mocha`
- `platform-chai`
- `platform-sinon`
- `platform-enzyme`
- `platform-ava`
- `platform-jasmine`
- `platform-karma`
- `platform-protractor`
- `platform-storybook-testing`
- `platform-eslint`
- `platform-prettier`
- `platform-stylelint`
- `platform-commitlint`
- `platform-husky`
- `platform-lint-staged`
- `platform-webpack`
- `platform-rollup`
- `platform-parcel`
- `platform-esbuild`
- `platform-vite`
- `platform-snowpack`
- `platform-babel`
- `platform-typescript`
- `platform-flow`
- `platform-reason`
- `platform-rescript`
- `platform-elm`
- `platform-purescript`
- `platform-clojurescript`
- `platform-scala-js`
- `platform-kotlin-js`
- `platform-fable`
- `platform-blazor`
- `platform-asp-net`
- `platform-django`
- `platform-flask`
- `platform-fastapi`
- `platform-rails`
- `platform-sinatra`
- `platform-laravel`
- `platform-symfony`
- `platform-express`
- `platform-koa`
- `platform-hapi`
- `platform-nest`
- `platform-next`
- `platform-nuxt`
- `platform-gatsby`
- `platform-sapper`
- `platform-svelte-kit`
- `platform-remix`
- `platform-blitz`
- `platform-redwood`
- `platform-docusaurus`
- `platform-vuepress`
- `platform-hexo`
- `platform-jekyll`
- `platform-hugo`
- `platform-eleventy`
- `platform-gridsome`
- `platform-middleman`
- `platform-metalsmith`
- `platform-phenomic`
- `platform-scully`
- `platform-sculpin`
- `platform-static-site-generator`
- `platform-jamstack`
- `platform-serverless`
- `platform-aws`
- `platform-gcp`
- `platform-azure`
- `platform-firebase`
- `platform-heroku`
- `platform-netlify`
- `platform-vercel`
- `platform-digital-ocean`
- `platform-linode`
- `platform-vultr`
- `platform-render`
- `platform-fly`
- `platform-aws-lambda`
- `platform-google-cloud-functions`
- `platform-azure-functions`
- `platform-cloudflare-workers`
- `platform-docker`
- `platform-kubernetes`
- `platform-docker-compose`
- `platform-vagrant`
- `platform-ansible`
- `platform-terraform`
- `platform-pulumi`
- `platform-chef`
- `platform-puppet`
- `platform-saltstack`
- `platform-serverless-framework`
- `platform-aws-sam`
- `platform-aws-cdk`
- `platform-google-cloud-deployment-manager`
- `platform-azure-resource-manager`
- `platform-helm`
- `platform-kustomize`
- `platform-skaffold`
- `platform-tilt`
- `platform-garden`
- `platform-devspace`
- `platform-okteto`
- `platform-telepresence`
- `platform-submariner`
- `platform-smi`
- `platform-istio`
- `platform-linkerd`
- `platform-consul`
- `platform-envoy`
- `platform-nginx`
- `platform-apache`
- `platform-caddy`
- `platform-traefik`
- `platform-haproxy`
- `platform-openresty`
- `platform-kong`
- `platform-tyk`
- `platform-apisix`
- `platform-graphql`
- `platform-apollo`
- `platform-relay`
- `platform-urql`
- `platform-graphql-yoga`
- `platform-graphql-helix`
- `platform-graphql-tools`
- `platform-graphql-code-generator`
- `platform-graphql-mesh`
- `platform-graphql-modules`
- `platform-graphql-shield`
- `platform-graphql-jit`
- `platform-graphql-ws`
- `platform-graphql-sse`
- `platform-graphql-subscriptions`
- `platform-graphql-voyager`
- `platform-graphiql`
- `platform-graphql-playground`
- `platform-graphql-editor`
- `platform-graphql-config`
- `platform-graphql-cli`
- `platform-graphql-eslint`
- `platform-graphql-prettier`
- `platform-graphql-stylelint`
- `platform-graphql-commitlint`
- `platform-graphql-husky`
- `platform-graphql-lint-staged`
- `platform-grpc`
- `platform-protobuf`
- `platform-thrift`
- `platform-avro`
- `platform-capn-proto`
- `platform-flatbuffers`
- `platform-zeromq`
- `platform-nanomsg`
- `platform-rabbitmq`
- `platform-kafka`
- `platform-activemq`
- `platform-nats`
- `platform-redis`
- `platform-memcached`
- `platform-postgresql`
- `platform-mysql`
- `platform-mariadb`
- `platform-sqlite`
- `platform-mongodb`
- `platform-couchdb`
- `platform-rethinkdb`
- `platform-cassandra`
- `platform-scylladb`
- `platform-elasticsearch`
- `platform-solr`
- `platform-algolia`
- `platform-meilisearch`
- `platform-typesense`
- `platform-influxdb`
- `platform-prometheus`
- `platform-grafana`
- `platform-kibana`
- `platform-logstash`
- `platform-fluentd`
- `platform-jaeger`
- `platform-zipkin`
- `platform-opentracing`
- `platform-opentelemetry`
- `platform-sentry`
- `platform-bugsnag`
- `platform-rollbar`
- `platform-airbrake`
- `platform-honeybadger`
- `platform-datadog`
- `platform-new-relic`
- `platform-appdynamics`
- `platform-dynatrace`
- `platform-instana`
- `platform-lightstep`
- `platform-wavefront`
- `platform-signal-fx`
- `platform-splunk`
- `platform-sumo-logic`
- `platform-loggly`
- `platform-papertrail`
- `platform-logz-io`
- `platform-coralogix`
- `platform-sematext`
- `platform-scalyr`
- `platform-timber`
- `platform-logdna`
- `platform-logtail`
- `platform-logentries`
- `platform-stackdriver`
- `platform-cloudwatch`
- `platform-azure-monitor`
- `platform-google-analytics`
- `platform-amplitude`
- `platform-mixpanel`
- `platform-heap`
- `platform-segment`
- `platform-mparticle`
- `platform-rudderstack`
- `platform-google-tag-manager`
- `platform-tealium`
- `platform-ensighten`
- `platform-launchdarkly`
- `platform-optimizely`
- `platform-vwo`
- `platform-split`
- `platform-unleash`
- `platform-flagsmith`
- `platform-statsig`
- `platform-growthbook`
- `platform-auth0`
- `platform-okta`
- `platform-firebase-auth`
- `platform-cognito`
- `platform-azure-ad-b2c`
- `platform-fusionauth`
- `platform-keycloak`
- `platform-ory`
- `platform-clerk`
- `platform-stytch`
- `platform-supertokens`
- `platform-magic`
- `platform-web3auth`
- `platform-stripe`
- `platform-paypal`
- `platform-braintree`
- `platform-adyen`
- `platform-square`
- `platform-checkout-com`
- `platform-paddle`
- `platform-chargebee`
- `platform-recurly`
- `platform-zuora`
- `platform-chargify`
- `platform-fastspring`
- `platform-gumroad`
- `platform-sendgrid`
- `platform-mailgun`
- `platform-postmark`
- `platform-sparkpost`
- `platform-mailchimp`
- `platform-sendinblue`
- `platform-mailerlite`
- `platform-convertkit`
- `platform-drip`
- `platform-customer-io`
- `platform-iterable`
- `platform-braze`
- `platform-onesignal`
- `platform-pusher`
- `platform-ably`
- `platform-pubnub`
- `platform-firebase-cloud-messaging`
- `platform-twilio`
- `platform-vonage`
- `platform-sinch`
- `platform-messagebird`
- `platform-plivo`
- `platform-telnyx`
- `platform-bandwidth`
- `platform-agora`
- `platform-daily`
- `platform-mux`
- `platform-jw-player`
- `platform-vimeo`
- `platform-youtube`
- `platform-wistia`
- `platform-cloudinary`
- `platform-imgix`
- `platform-fastly`
- `platform-akamai`
- `platform-cloudflare`
- `platform-aws-cloudfront`
- `platform-google-cloud-cdn`
- `platform-azure-cdn`
- `platform-netlify-edge`
- `platform-vercel-edge`
- `platform-contentful`
- `platform-sanity`
- `platform-storyblok`
- `platform-datocms`
- `platform-graphcms`
- `platform-prismic`
- `platform-contentstack`
- `platform-buttercms`
- `platform-strapi`
- `platform-directus`
- `platform-payload`
- `platform-keystone`
- `platform-ghost`
- `platform-wordpress`
- `platform-drupal`
- `platform-joomla`
- `platform-magento`
- `platform-shopify`
- `platform-bigcommerce`
- `platform-wix`
- `platform-squarespace`
- `platform-webflow`
- `platform-airtable`
- `platform-notion`
- `platform-coda`
- `platform-google-sheets`
- `platform-google-docs`
- `platform-google-slides`
- `platform-google-forms`
- `platform-google-drive`
- `platform-dropbox`
- `platform-box`
- `platform-onedrive`
- `platform-trello`
- `platform-asana`
- `platform-jira`
- `platform-monday`
- `platform-clickup`
- `platform-basecamp`
- `platform-slack`
- `platform-discord`
- `platform-microsoft-teams`
- `platform-zoom`
- `platform-google-meet`
- `platform-skype`
- `platform-whatsapp`
- `platform-telegram`
- `platform-signal`
- `platform-facebook-messenger`
- `platform-instagram`
- `platform-twitter`
- `platform-linkedin`
- `platform-pinterest`
- `platform-snapchat`
- `platform-tiktok`
- `platform-reddit`
- `platform-medium`
- `platform-substack`
- `platform-dev-to`
- `platform-hashnode`
- `platform-stackoverflow`
- `platform-github`
- `platform-gitlab`
- `platform-bitbucket`
- `platform-sourceforge`
- `platform-codepen`
- `platform-codesandbox`
- `platform-stackblitz`
- `platform-glitch`
- `platform-replit`
- `platform-jsfiddle`
- `platform-dribbble`
- `platform-behance`
- `platform-pinterest`
- `platform-unsplash`
- `platform-pexels`
- `platform-pixabay`
- `platform-fontawesome`
- `platform-material-design-icons`
- `platform-heroicons`
- `platform-feather-icons`
- `platform-iconoir`
- `platform-icon-sets`
- `platform-google-fonts`
- `platform-adobe-fonts`
- `platform-fonts-com`
- `platform-myfonts`
- `platform-fontspring`
- `platform-typography`
- `platform-color-palettes`
- `platform-ui-kits`
- `platform-design-systems`
- `platform-wireframing-tools`
- `platform-prototyping-tools`
- `platform-user-testing-tools`
- `platform-a-b-testing-tools`
- `platform-analytics-tools`
- `platform-seo-tools`
- `platform-project-management-tools`
- `platform-communication-tools`
- `platform-collaboration-tools`
- `platform-developer-tools`
- `platform-devops-tools`
- `platform-cicd-tools`
- `platform-testing-tools`
- `platform-monitoring-tools`
- `platform-logging-tools`
- `platform-tracing-tools`
- `platform-profiling-tools`
- `platform-debugging-tools`
- `platform-security-tools`
- `platform-static-analysis-tools`
- `platform-code-coverage-tools`
- `platform-code-review-tools`
- `platform-code-formatting-tools`
- `platform-code-linting-tools`
- `platform-code-generation-tools`
- `platform-build-tools`
- `platform-package-managers`
- `platform-version-managers`
- `platform-containerization-tools`
- `platform-orchestration-tools`
- `platform-configuration-management-tools`
- `platform-infrastructure-as-code-tools`
- `platform-serverless-tools`
- `platform-database-tools`
- `platform-caching-tools`
- `platform-messaging-tools`
- `platform-search-tools`
- `platform-api-tools`
- `platform-authentication-tools`
- `platform-authorization-tools`
- 