const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

const mapViewStub = path.join(projectRoot, "stubs/react-native-maps-mapview.js");
const mapMarkerStub = path.join(projectRoot, "stubs/react-native-maps-marker.js");
const mapPolylineStub = path.join(projectRoot, "stubs/react-native-maps-polyline.js");

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    const isPackage =
      moduleName === "react-native-maps" ||
      moduleName.startsWith("react-native-maps/");

    if (isPackage) {
      if (moduleName.includes("MapMarker")) {
        return { type: "sourceFile", filePath: mapMarkerStub };
      }
      if (moduleName.includes("MapPolyline")) {
        return { type: "sourceFile", filePath: mapPolylineStub };
      }
      return { type: "sourceFile", filePath: mapViewStub };
    }
  }

  if (typeof defaultResolveRequest === "function") {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
