const React = require("react");
const { View } = require("react-native");

const MapView = React.forwardRef(function MapViewStub(props, ref) {
  React.useImperativeHandle(ref, () => ({
    fitToCoordinates() {},
    animateToRegion() {},
  }));
  return React.createElement(View, { style: props.style });
});

module.exports = MapView;
module.exports.default = MapView;
