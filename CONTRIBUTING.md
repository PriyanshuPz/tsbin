# Contributing to tsbin

Thank you for your interest in contributing to **tsbin (Trashbin)**! 🎉
We welcome contributions of all kinds, from code improvements and bug fixes to documentation and ideas for new features.

This document will help you get started and explain our guidelines for contributing.

---

## 🧩 **Before You Begin**

- Make sure Node.js ≥ 18 and Bun ≥ 1.0 are installed
- Read the README.md first
- Familiarize yourself with project structure:
  /frontend → React app
  /backend → API & server
  /packages/cli → optional CLI

---

## **Table of Contents**

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
3. [Development Setup](#development-setup)
4. [Reporting Issues](#reporting-issues)
5. [Submitting Pull Requests](#submitting-pull-requests)
6. [Security and Privacy Guidelines](#security-and-privacy-guidelines)

---

## **Code of Conduct**

- Be respectful, professional, and welcoming to everyone.
- This project is intended for **legal and ethical use only**. Contributions that promote unethical or illegal behavior will not be accepted.
- Harassment or offensive behavior will not be tolerated.

By contributing, you agree to follow this code of conduct.

---

## **How to Contribute**

You can contribute in several ways:

- **Bug reports & issues** – let us know if something isn’t working.
- **Feature requests** – suggest new functionality.
- **Code contributions** – fix bugs, implement features, improve performance.
- **Documentation** – improve READMEs, guides, examples, or help clarify concepts.

> Note: Even small contributions like fixing typos or improving comments are valuable!

---

## **Development Setup**

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/tsbin.git
cd tsbin
```

2. **Install dependencies for frontend**

```bash
cd frontend
bun install
```

3. **Install dependencies for backend**

```bash
cd ../backend
bun install
```

4. **Run development servers**

```bash
# Frontend
bun run dev

# Backend
bun run dev
```

5. **Optional CLI setup (soon)**

- CLI is a separate module; refer to `packages/cli` for instructions.

---

## **Reporting Issues**

- Use the **GitHub Issues** page.
- Include:

  - Clear description of the problem
  - Steps to reproduce
  - Expected behavior vs actual behavior
  - Environment details (Node version, OS, browser if relevant)

---

## **Submitting Pull Requests**

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/my-feature
```

3. Commit your changes:

```bash
git commit -m "Add brief description of changes"
```

4. Push to your fork:

```bash
git push origin feature/my-feature
```

5. Open a **Pull Request** against `master`.

**Guidelines:**

- Keep commits small and focused.
- Include **tests** or verify functionality when possible.
- Ensure code is **consistent with TypeScript + project style**.
- PR title should be descriptive.
- Include screenshots or GIFs for frontend/UI changes.

---

## **Security and Privacy Guidelines**

- **Do not store unencrypted file contents** in the repository or database.
- Always use **end-to-end encryption** for any file content.
- When handling user data (even anonymous), **do not expose sensitive keys or credentials**.
- Encourage users to **create accounts for enhanced security** if you implement features that involve storing encryption keys.

---

## **Additional Notes**

- tsbin is a collaborative, **open-source project**. Everyone is welcome to contribute.
- For larger features or breaking changes, open an **issue first** to discuss the design.

---

### ✅ **Pre-PR Checklist**

- [ ] Tested changes locally
- [ ] Updated documentation if needed
- [ ] Followed linting/formatting rules
- [ ] Linked the related issue

---

## 📚 **Resources for Beginners**

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Markdown Cheat Sheet](https://www.markdownguide.org/cheat-sheet/)
- [Open Source Guide](https://opensource.guide/how-to-contribute/)

---

> Thank you for helping make tsbin secure, user-friendly, and open-source!
