import * as vscode from "vscode";

async function getFeatureGateValues() {
  try {
    const featureGateUrl = vscode.workspace
      .getConfiguration()
      .get("ecs-vscode.ecsUrl") as string;
    const jsonResponsePath = vscode.workspace
      .getConfiguration()
      .get("ecs-vscode.jsonResponsePath") as string;
    const featureGateResponse = await fetch(featureGateUrl);
    const featureGateJson = (await featureGateResponse.json()) as any;
    const featureGateValues = featureGateJson[jsonResponsePath];
    if (!featureGateValues) {
      throw new Error("no feature gate values found");
    }
    return featureGateValues;
  } catch {
    vscode.window.showErrorMessage(
      "Unable to fetch feature gate values. Please check your settings."
    );
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const featureGateValues = await getFeatureGateValues();

  const hover = vscode.languages.registerHoverProvider(
    ["javascript", "typescript", "javascriptreact", "typescriptreact"],
    {
      provideHover(document, position, token) {
        // check if the word is useFeatureGate
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        if (word === "useFeatureGate") {
          // check if feature name is on the same line
          const line = document.lineAt(position);
          let featureName = line.text.match(
            /useFeatureGate\(['"](.*)['"]\)/
          )?.[1];

          // if it's not on the same line, check the next line
          if (!featureName) {
            const nextLine = document.lineAt(position.line + 1);
            featureName = nextLine.text.match(/['"](.*)['"]/)?.[1];
          }

          // unable to find feature name
          if (featureName) {
            return new vscode.Hover(
              `\`${featureName}\`: ${featureGateValues[featureName]}`
            );
          } else {
            return new vscode.Hover("Couldn't parse the feature name :(");
          }
        }
      },
    }
  );

  context.subscriptions.push(hover);
}
