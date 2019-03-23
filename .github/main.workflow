workflow "Deploy" {
  on = "push"
  resolves = [
    "Release",
  ]
}

action "Master" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Release" {
  uses = "satya164/node-app-tasks@master"
  secrets = ["NPM_AUTH_TOKEN", "GITHUB_TOKEN"]
  args = "release-it --non-interactive"
}
