import fs from "fs";
import path from "path";
import ts from "typescript";

type Env = Record<string, any>;

type ModuleConfig = {
  sourcePath: string;
  key: string;
};

const MAP_PATH = path.join("agents", "active", "fantasytown-assets", "ThreeJsPages-o9p4mP9v.js.map");
const OUTPUT_PATH = path.join("docs", "temporary-settlement-options.json");

const moduleConfigs: ModuleConfig[] = [
  { sourcePath: "../../src/render/utils/edgeUtils.ts", key: "edgeUtils" },
  { sourcePath: "../../src/interface/filters/layer/layerColors.ts", key: "layerColors" },
  { sourcePath: "../../src/home/new-settlement/newSettlementTypes.ts", key: "newSettlementTypes" },
  { sourcePath: "../../src/home/new-settlement/districts/districtConstants.tsx", key: "districtConstants" },
];

interface SourceMapPayload {
  sources: string[];
  sourcesContent: (string | null)[];
}

function loadSourceMap(): SourceMapPayload {
  const raw = fs.readFileSync(MAP_PATH, "utf8");
  return JSON.parse(raw) as SourceMapPayload;
}

function getModuleContent(map: SourceMapPayload, sourcePath: string): string {
  const index = map.sources.indexOf(sourcePath);
  if (index === -1) {
    throw new Error(`Unable to locate ${sourcePath} in source map.`);
  }
  const content = map.sourcesContent[index];
  if (content == null) {
    throw new Error(`No source content for ${sourcePath}.`);
  }
  return content;
}

function cloneEnv(env: Env): Env {
  return Object.assign(Object.create(null), env);
}

const baseEnv: Env = Object.assign(Object.create(null), {
  Math,
  Object,
  Array,
  Number,
  String,
  Boolean,
  formatEnum(value: string): string {
    if (value == null) return value;
    return value
      .split(/[_-]/)
      .map(part => (part.length ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  },
  lowercaseFormatEnum(value: string): string {
    return baseEnv.formatEnum(value).toLowerCase();
  }
});

function evaluate(node: ts.Node, env: Env): any {
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
      return (node as ts.StringLiteral).text;
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return (node as ts.NoSubstitutionTemplateLiteral).text;
    case ts.SyntaxKind.NumericLiteral:
      return Number((node as ts.NumericLiteral).text);
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.NullKeyword:
      return null;
    case ts.SyntaxKind.ParenthesizedExpression:
      return evaluate((node as ts.ParenthesizedExpression).expression, env);
    case ts.SyntaxKind.AsExpression:
      return evaluate((node as ts.AsExpression).expression, env);
    case ts.SyntaxKind.NonNullExpression:
      return evaluate((node as ts.NonNullExpression).expression, env);
    case ts.SyntaxKind.ArrayLiteralExpression: {
      const arrNode = node as ts.ArrayLiteralExpression;
      const result: any[] = [];
      for (const element of arrNode.elements) {
        if (ts.isSpreadElement(element)) {
          const spreadValue = evaluate(element.expression, env);
          if (!Array.isArray(spreadValue)) {
            throw new Error("Spread value is not iterable.");
          }
          result.push(...spreadValue);
        } else {
          result.push(evaluate(element, env));
        }
      }
      return result;
    }
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const objNode = node as ts.ObjectLiteralExpression;
      const result: Record<string, any> = {};
      for (const property of objNode.properties) {
        if (ts.isPropertyAssignment(property)) {
          const key = getPropertyName(property.name, env);
          result[key] = evaluate(property.initializer, env);
        } else if (ts.isShorthandPropertyAssignment(property)) {
          const key = property.name.text;
          if (!(key in env)) {
            throw new Error(`Identifier ${key} not found in environment.`);
          }
          result[key] = env[key];
        } else if (ts.isSpreadAssignment(property)) {
          const spreadValue = evaluate(property.expression, env);
          Object.assign(result, spreadValue);
        } else {
          throw new Error(`Unsupported object property kind: ${ts.SyntaxKind[property.kind]}`);
        }
      }
      return result;
    }
    case ts.SyntaxKind.Identifier: {
      const name = (node as ts.Identifier).text;
      if (!(name in env)) {
        throw new Error(`Identifier ${name} not found in environment.`);
      }
      return env[name];
    }
    case ts.SyntaxKind.PropertyAccessExpression: {
      const propNode = node as ts.PropertyAccessExpression;
      const target = evaluate(propNode.expression, env);
      const name = propNode.name.text;
      if (target == null || !(name in target)) {
        throw new Error(`Property ${name} missing on target during evaluation.`);
      }
      return target[name];
    }
    case ts.SyntaxKind.ElementAccessExpression: {
      const elNode = node as ts.ElementAccessExpression;
      const target = evaluate(elNode.expression, env);
      const index = evaluate(elNode.argumentExpression!, env);
      return target[index];
    }
    case ts.SyntaxKind.TemplateExpression: {
      const tpl = node as ts.TemplateExpression;
      let result = tpl.head.text;
      for (const span of tpl.templateSpans) {
        result += evaluate(span.expression, env);
        result += span.literal.text;
      }
      return result;
    }
    case ts.SyntaxKind.BinaryExpression: {
      const binary = node as ts.BinaryExpression;
      const left = evaluate(binary.left, env);
      const right = evaluate(binary.right, env);
      switch (binary.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
          return left + right;
        case ts.SyntaxKind.MinusToken:
          return left - right;
        case ts.SyntaxKind.AsteriskToken:
          return left * right;
        case ts.SyntaxKind.SlashToken:
          return left / right;
        default:
          throw new Error(`Unsupported binary operator: ${ts.SyntaxKind[binary.operatorToken.kind]}`);
      }
    }
    case ts.SyntaxKind.ConditionalExpression: {
      const cond = node as ts.ConditionalExpression;
      return evaluate(cond.condition, env) ? evaluate(cond.whenTrue, env) : evaluate(cond.whenFalse, env);
    }
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.FunctionExpression:
      return createFunction(node as ts.SignatureDeclaration, env);
    case ts.SyntaxKind.CallExpression: {
      const call = node as ts.CallExpression;
      const args = call.arguments.map(arg => evaluate(arg, env));
      if (ts.isPropertyAccessExpression(call.expression)) {
        const target = evaluate(call.expression.expression, env);
        const fn = target[call.expression.name.text];
        if (typeof fn !== "function") {
          throw new Error(`Property ${call.expression.name.text} is not callable.`);
        }
        return fn.apply(target, args);
      }
      const fn = evaluate(call.expression, env);
      if (typeof fn !== "function") {
        throw new Error("Call target is not a function.");
      }
      return fn(...args);
    }
    case ts.SyntaxKind.SpreadElement:
      return evaluate((node as ts.SpreadElement).expression, env);
    default:
      throw new Error(`Unsupported syntax kind: ${ts.SyntaxKind[node.kind]}`);
  }
}

function createFunction(node: ts.SignatureDeclaration, env: Env): (...args: any[]) => any {
  const paramNames = node.parameters.map(param => {
    if (!ts.isIdentifier(param.name)) {
      throw new Error("Only simple identifiers supported in arrow function parameters.");
    }
    return param.name.text;
  });

  const body = node.kind === ts.SyntaxKind.ArrowFunction
    ? (node as ts.ArrowFunction).body
    : (node as ts.FunctionExpression).body;

  return (...args: any[]) => {
    const localEnv = cloneEnv(env);
    paramNames.forEach((name, index) => {
      localEnv[name] = args[index];
    });
    if (ts.isBlock(body)) {
      return evaluateBlock(body, localEnv);
    }
    return evaluate(body, localEnv);
  };
}

function evaluateBlock(block: ts.Block, env: Env): any {
  let result: any;
  for (const statement of block.statements) {
    if (ts.isReturnStatement(statement)) {
      result = statement.expression ? evaluate(statement.expression, env) : undefined;
      return result;
    }
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) {
          throw new Error("Only identifier declarations supported.");
        }
        const value = decl.initializer ? evaluate(decl.initializer, env) : undefined;
        env[decl.name.text] = value;
      }
      continue;
    }
    throw new Error(`Unsupported statement inside function body: ${ts.SyntaxKind[statement.kind]}`);
  }
  return result;
}

function getPropertyName(name: ts.PropertyName, env: Env): string {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  if (ts.isComputedPropertyName(name)) {
    const value = evaluate(name.expression, env);
    return String(value);
  }
  throw new Error("Unsupported property name kind.");
}

function main(): void {
  const aggregate: Record<string, any> = {};
  const sharedEnv = cloneEnv(baseEnv);
  const map = loadSourceMap();

  for (const moduleConfig of moduleConfigs) {
    const content = getModuleContent(map, moduleConfig.sourcePath);
    const sourceFile = ts.createSourceFile(moduleConfig.sourcePath, content, ts.ScriptTarget.Latest, true, moduleConfig.sourcePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

    const moduleExports: Record<string, any> = {};

    sourceFile.forEachChild(node => {
      if (ts.isVariableStatement(node)) {
        const isExported = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
        const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
        if (!isExported || !isConst) return;
        node.declarationList.declarations.forEach(declaration => {
          if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
            return;
          }
          const name = declaration.name.text;
          try {
            const value = evaluate(declaration.initializer, sharedEnv);
            sharedEnv[name] = value;
            moduleExports[name] = value;
          } catch (error) {
            moduleExports[name] = { error: (error as Error).message };
          }
        });
      }
    });

    aggregate[moduleConfig.key] = moduleExports;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(aggregate, null, 2));
  console.log(`Extracted option data to ${OUTPUT_PATH}`);
}

main();

