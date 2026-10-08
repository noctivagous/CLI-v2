var D0 = {
  "type": "dir",
  "children": {
    "src": {
      "type": "dir",
      "children": {
        "index.ts": {
          "type": "file",
          "content": "// entry\nconsole.log(\"hello\")"
        },
        "App.tsx": {
          "type": "file",
          "content": "export default function App() {}"
        },
        "components": {
          "type": "dir",
          "children": {
            "Box.tsx": {
              "type": "file",
              "content": ""
            }
          }
        }
      }
    },
    "docs": {
      "type": "dir",
      "children": {
        "readme.md": {
          "type": "file",
          "content": "# Docs\n\nWelcome to CLI v2"
        },
        "guide.md": {
          "type": "file",
          "content": "Usage guide..."
        }
      }
    },
    "projects": {
      "type": "dir",
      "children": {
        "cli": {
          "type": "dir",
          "children": {
            "v1.md": {
              "type": "file",
              "content": "v1 notes"
            }
          }
        },
        "site": {
          "type": "dir",
          "children": {}
        }
      }
    },
    "notes.txt": {
      "type": "file",
      "content": "TODO:\n- blend graphics + keyboard\n- keep baseline grid\n- commit with space"
    },
    "todo.md": {
      "type": "file",
      "content": "- [x] build v2\n- [ ] ship"
    }
  }
};
