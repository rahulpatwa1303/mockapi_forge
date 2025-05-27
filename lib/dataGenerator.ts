import { faker } from '@faker-js/faker';

// Type for the structure being processed
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue; }
interface JsonArray extends Array<JsonValue> { }

// Function to safely access nested faker properties
function getFakerFunction(path: string): ((options?: any) => any) | undefined { // Allow an optional argument
    const parts = path.split('.'); // e.g., "internet.email"
    if (parts.length === 0 || parts[0] !== 'faker') {
        console.log(`getFakerFunction: Path "${path}" does not start with faker.`);
        return undefined;
    }

    let obj: any = faker;
    for (let i = 1; i < parts.length; i++) {
        if (obj && typeof obj === 'object' && parts[i] in obj) {
            obj = obj[parts[i]];
        } else {
            return undefined;
        }
    }

    if (typeof obj === 'function') {
        return obj as (options?: any) => any; // Cast to a function that can take an optional argument
    }
    return undefined;
}

function processValue(value: JsonValue, pathPrefix: string = ""): JsonValue {
    console.log(`${pathPrefix}Processing value:`, JSON.stringify(value));
    if (typeof value === 'string') {
        // Regex to capture {{faker.path.to.method}} or {{faker.path.to.method(JSON_ARGS_HERE)}}
        const match = value.match(/^{{([\w.]+)(?:\((.*)\))?}}$/);

        if (match) {
            const fakerPath = match[1]; // e.g., faker.internet.email or faker.number.int
            const argsStringWithParens = match[2]; // e.g., {"min":1,"max":10} (if present, undefined otherwise)

            const fakerFunc = getFakerFunction(fakerPath);
            if (fakerFunc) {
                try {
                    if (argsStringWithParens !== undefined) { // Check if args were actually provided in the template
                        // argsStringWithParens is the content *inside* the parentheses
                        // It could be empty if it was {{faker.func()}}
                        if (argsStringWithParens.trim() !== "") {
                            const args = JSON.parse(argsStringWithParens); // Assumes args are valid JSON if present
                            return fakerFunc(args); // Call with parsed arguments
                        } else {
                            // Case: {{faker.func()}} -> treat as no-arg call for most functions
                            // or a function that takes an empty object as options.
                            // Some faker functions might behave differently with func() vs func.
                            // For simplicity here, if parens are empty, call without args.
                            // If a specific func needs an empty object for options, template should be {{faker.func({})}}
                            return fakerFunc();
                        }
                    } else {
                        // No parentheses in the template, e.g., {{faker.internet.email}}
                        return fakerFunc(); // Call without arguments
                    }
                } catch (e) {
                    console.error(`Error executing faker function ${fakerPath} with args ${argsStringWithParens}:`, e);
                    return `Error: Faker (${fakerPath})`;
                }
            } else {
                return `Error: Unknown Faker Path (${fakerPath})`;
            }
        }
        return value; // Not a faker template
    } else if (Array.isArray(value)) {
        return value.map((item, index) => processValue(item, `${pathPrefix}[${index}]`));
    } else if (typeof value === 'object' && value !== null) {
        const newObj: JsonObject = {};
        for (const key in value) {
            newObj[key] = processValue(value[key], `${pathPrefix}${key}.`);
        }
        return newObj;
    }
    return value;
}

export function generateMockData(
    structure: JsonObject,
    isArray: boolean,
    arrayCount: number
  ): JsonObject | JsonArray {
    // console.log("generateMockData called with structure:", JSON.stringify(structure), "isArray:", isArray, "arrayCount:", arrayCount); // Log inputs
  
    if (isArray) {
      const results: JsonArray = [];
      for (let i = 0; i < Math.max(1, arrayCount); i++) {
        // console.log(`generateMockData: Generating item ${i + 1} for array`);
        results.push(processValue(JSON.parse(JSON.stringify(structure)), `item${i}.`) as JsonObject);
      }
      // console.log("generateMockData array result:", JSON.stringify(results));
      return results;
    } else {
      const result = processValue(JSON.parse(JSON.stringify(structure)), `singleItem.`) as JsonObject;
      // console.log("generateMockData single object result:", JSON.stringify(result));
      return result;
    }
  }