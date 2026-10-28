# settings.json — example

This is a reference, not a live config. The real file is `.claude/settings.json`.

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run build)",
      "Bash(npm run dev)",
      "Bash(npm test)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force)"
    ]
  }
}
```

Copy the JSON above into `.claude/settings.json` and adjust to your needs.
