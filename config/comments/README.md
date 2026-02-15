# Comment Library

This directory contains boilerplate text for common findings.

## Structure

```
comments/
├── README.md
├── defaults.yaml      # Built-in sensible defaults
└── custom.yaml        # Inspector's custom comments (add later)
```

## How It Works

1. During inspection, the AI captures the inspector's notes
2. When generating the report, it matches findings to boilerplate
3. Custom comments override defaults
4. If no match, AI generates professional text from notes

## Adding Custom Comments

Edit `custom.yaml` with your own boilerplate:

```yaml
exterior:
  roof:
    - id: rust_minor
      match: ["rust", "surface rust", "minor rust"]
      text: "Minor surface rust observed on roofing iron. This is cosmetic and does not currently affect weathertightness. Monitor and consider repainting within 2-3 years."
    
    - id: rust_significant  
      match: ["significant rust", "heavy rust", "rusted through"]
      text: "Significant rust deterioration observed on roofing. Immediate attention recommended. Replacement or professional assessment advised."
```

## Match Logic

- `match` keywords trigger this comment
- Multiple keywords = any match
- Longer/more specific matches take priority
- Inspector can always override with custom text
