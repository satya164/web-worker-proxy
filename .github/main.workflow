workflow "Deploy" {
  on = "push"
  resolves = [
    "Master",
    "Release",
  ]
}

action "Master" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Release" {
  needs = "Master"
  uses = "satya164/node-app-tasks@master"
  secrets = ["NPM_AUTH_TOKEN", "GITHUB_TOKEN"]
  args = "release-it --non-interactive"
}
