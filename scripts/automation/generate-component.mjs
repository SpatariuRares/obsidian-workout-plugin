/**
 * Component Generator - E Layer (Execution)
 *
 * Generates boilerplate code for atomic design components.
 * Part of the DOE Framework automation layer.
 *
 * Usage:
 *   npm run doe:generate-component -- --name=MyComponent --type=atom
 *   node scripts/automation/generate-component.mjs --name=MyComponent --type=molecule
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../..");

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    name: null,
    type: "atom", // atom, molecule, organism
    force: false,
  };

  args.forEach((arg) => {
    if (arg.startsWith("--name=")) {
      parsed.name = arg.split("=")[1];
    } else if (arg.startsWith("--type=")) {
      parsed.type = arg.split("=")[1];
    } else if (arg === "--force") {
      parsed.force = true;
    }
  });

  return parsed;
}

/**
 * Validate arguments
 */
function validateArgs(args) {
  if (!args.name) {
    console.error("Error: Component name is required");
    console.log("Usage: npm run doe:generate-component -- --name=MyComponent --type=atom");
    process.exit(1);
  }

  if (!["atom", "molecule", "organism"].includes(args.type)) {
    console.error("Error: Type must be atom, molecule, or organism");
    process.exit(1);
  }

  // Validate name format (PascalCase)
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(args.name)) {
    console.error("Error: Component name must be in PascalCase (e.g., MyComponent)");
    process.exit(1);
  }
}

/**
 * Generate component file content
 */
function generateComponentContent(name, type) {
  const typeDescription = {
    atom: "primitive component with single responsibility",
    molecule: "composite component built from atoms",
    organism: "complex component built from molecules and atoms",
  };

  return `/**
 * ${name} - ${typeDescription[type]}
 *
 * @example
 * const element = ${name}.create(container, {
 *   // props
 * });
 */

export interface ${name}Props {
  // Define component props
  className?: string;
}

export class ${name} {
  /**
   * Create ${name} component
   *
   * @param container - Parent container
   * @param props - Component props
   * @returns Created element
   */
  static create(container: HTMLElement, props: ${name}Props = {}): HTMLElement {
    const element = container.createDiv({
      cls: this.getClassName(props.className),
    });

    // Render component content
    this.render(element, props);

    return element;
  }

  /**
   * Render component content
   */
  private static render(element: HTMLElement, props: ${name}Props): void {
    // TODO: Implement rendering logic
    element.textContent = "${name} component";
  }

  /**
   * Get component CSS class
   */
  private static getClassName(customClass?: string): string {
    const baseClass = "workout-${name.toLowerCase()}";
    return customClass ? \`\${baseClass} \${customClass}\` : baseClass;
  }

  /**
   * Update component props
   */
  static update(element: HTMLElement, props: Partial<${name}Props>): void {
    element.empty();
    this.render(element, props as ${name}Props);
  }

  /**
   * Destroy component (cleanup resources)
   */
  static destroy(element: HTMLElement): void {
    element.remove();
  }
}
`;
}

/**
 * Generate test file content
 */
function generateTestContent(name, type) {
  return `import { ${name} } from "../${name}";

describe("${name}", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  afterEach(() => {
    container.remove();
  });

  describe("create", () => {
    it("should create ${type} component", () => {
      const element = ${name}.create(container, {});

      expect(element).toBeDefined();
      expect(element.className).toContain("workout-${name.toLowerCase()}");
    });

    it("should apply custom className", () => {
      const element = ${name}.create(container, {
        className: "custom-class",
      });

      expect(element.className).toContain("workout-${name.toLowerCase()}");
      expect(element.className).toContain("custom-class");
    });

    it("should render content", () => {
      const element = ${name}.create(container, {});

      expect(element.textContent).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should update component props", () => {
      const element = ${name}.create(container, {});

      ${name}.update(element, {
        // Updated props
      });

      expect(element).toBeDefined();
    });
  });

  describe("destroy", () => {
    it("should remove component from DOM", () => {
      const element = ${name}.create(container, {});

      expect(container.children.length).toBe(1);

      ${name}.destroy(element);

      expect(container.children.length).toBe(0);
    });
  });
});
`;
}

/**
 * Update barrel export file
 */
async function updateBarrelExport(componentDir, name) {
  const indexPath = path.join(componentDir, "index.ts");

  try {
    let content = await fs.readFile(indexPath, "utf-8");

    // Add export statement
    const exportStatement = `export { ${name}, type ${name}Props } from "./${name}";\n`;

    // Check if already exported
    if (content.includes(exportStatement.trim())) {
      console.log("  ⚠ Component already exported in index.ts");
      return;
    }

    // Append export
    content += exportStatement;

    await fs.writeFile(indexPath, content, "utf-8");
    console.log("  ✓ Updated index.ts with export");
  } catch (error) {
    if (error.code === "ENOENT") {
      // Create index.ts if it doesn't exist
      await fs.writeFile(indexPath, `export { ${name}, type ${name}Props } from "./${name}";\n`, "utf-8");
      console.log("  ✓ Created index.ts with export");
    } else {
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();
  validateArgs(args);

  const { name, type, force } = args;

  console.log(`\nGenerating ${type} component: ${name}`);
  console.log("─".repeat(50));

  // Determine directory
  const componentDir = path.join(ROOT_DIR, "app", "components", `${type}s`);
  const componentPath = path.join(componentDir, `${name}.ts`);
  const testDir = path.join(componentDir, "__tests__");
  const testPath = path.join(testDir, `${name}.test.ts`);

  // Check if component already exists
  try {
    await fs.access(componentPath);
    if (!force) {
      console.error(`\nError: Component ${name} already exists at ${componentPath}`);
      console.log("Use --force to overwrite");
      process.exit(1);
    }
  } catch (error) {
    // File doesn't exist, continue
  }

  // Create directories if needed
  await fs.mkdir(componentDir, { recursive: true });
  await fs.mkdir(testDir, { recursive: true });

  // Generate component file
  const componentContent = generateComponentContent(name, type);
  await fs.writeFile(componentPath, componentContent, "utf-8");
  console.log(`  ✓ Created component: ${path.relative(ROOT_DIR, componentPath)}`);

  // Generate test file
  const testContent = generateTestContent(name, type);
  await fs.writeFile(testPath, testContent, "utf-8");
  console.log(`  ✓ Created test: ${path.relative(ROOT_DIR, testPath)}`);

  // Update barrel export
  await updateBarrelExport(componentDir, name);

  console.log("\n✅ Component generated successfully!");
  console.log("\nNext steps:");
  console.log(`  1. Implement rendering logic in ${name}.ts`);
  console.log(`  2. Write tests in ${name}.test.ts`);
  console.log(`  3. Add CSS styles in styles/components/`);
  console.log(`  4. Import and use: import { ${name} } from "@app/components/${type}s";`);
  console.log("");
}

main().catch((error) => {
  console.error("\n✗ Error generating component:", error.message);
  process.exit(1);
});
