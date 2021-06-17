"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.promise");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.setDefaults = setDefaults;
exports.default = request;

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/keys"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/objectWithoutProperties"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _abortController = _interopRequireDefault(require("abort-controller"));

var _httpsProxyAgent = _interopRequireDefault(require("https-proxy-agent"));

var _requestHelper = require("./request-helper");

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context2; _forEachInstanceProperty(_context2 = ownKeys(Object(source), true)).call(_context2, function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context3; _forEachInstanceProperty(_context3 = ownKeys(Object(source))).call(_context3, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 *
 */
let defaults = {};
/**
 *
 */

function setDefaults(defaults_) {
  defaults = defaults_;
}
/**
 *
 */


async function startFetchRequest(request, options, input, output, emitter, counter = 0) {
  const {
    httpProxy,
    followRedirect
  } = options;
  const agent = httpProxy ? (0, _httpsProxyAgent.default)(httpProxy) : undefined;
  const {
    url,
    body
  } = request,
        rrequest = (0, _objectWithoutProperties2.default)(request, ["url", "body"]);
  const controller = new _abortController.default();
  let res;

  try {
    res = await (0, _requestHelper.executeWithTimeout)(() => (0, _nodeFetch.default)(url, _objectSpread(_objectSpread(_objectSpread({}, rrequest), input && /^(post|put|patch)$/i.test(request.method) ? {
      body: input
    } : {}), {}, {
      redirect: 'manual',
      signal: controller.signal,
      agent
    })), options.timeout, () => controller.abort());
  } catch (err) {
    emitter.emit('error', err);
    return;
  }

  const headers = {};

  for (const headerName of (0, _keys.default)(_context = res.headers).call(_context)) {
    var _context;

    headers[headerName.toLowerCase()] = res.headers.get(headerName);
  }

  const response = {
    statusCode: res.status,
    headers
  };

  if (followRedirect && (0, _requestHelper.isRedirect)(response.statusCode)) {
    try {
      (0, _requestHelper.performRedirectRequest)(request, response, followRedirect, counter, req => startFetchRequest(req, options, undefined, output, emitter, counter + 1));
    } catch (err) {
      emitter.emit('error', err);
    }

    return;
  }

  emitter.emit('response', response);
  res.body.pipe(output);
}
/**
 *
 */


function request(req, options_ = {}) {
  const options = _objectSpread(_objectSpread({}, defaults), options_);

  const {
    input,
    output,
    stream
  } = (0, _requestHelper.createHttpRequestHandlerStreams)(req);
  startFetchRequest(req, options, input, output, stream);
  return stream;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXF1ZXN0LnRzIl0sIm5hbWVzIjpbImRlZmF1bHRzIiwic2V0RGVmYXVsdHMiLCJkZWZhdWx0c18iLCJzdGFydEZldGNoUmVxdWVzdCIsInJlcXVlc3QiLCJvcHRpb25zIiwiaW5wdXQiLCJvdXRwdXQiLCJlbWl0dGVyIiwiY291bnRlciIsImh0dHBQcm94eSIsImZvbGxvd1JlZGlyZWN0IiwiYWdlbnQiLCJ1bmRlZmluZWQiLCJ1cmwiLCJib2R5IiwicnJlcXVlc3QiLCJjb250cm9sbGVyIiwiQWJvcnRDb250cm9sbGVyIiwicmVzIiwidGVzdCIsIm1ldGhvZCIsInJlZGlyZWN0Iiwic2lnbmFsIiwidGltZW91dCIsImFib3J0IiwiZXJyIiwiZW1pdCIsImhlYWRlcnMiLCJoZWFkZXJOYW1lIiwidG9Mb3dlckNhc2UiLCJnZXQiLCJyZXNwb25zZSIsInN0YXR1c0NvZGUiLCJzdGF0dXMiLCJyZXEiLCJwaXBlIiwib3B0aW9uc18iLCJzdHJlYW0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBUUE7QUFDQTtBQUNBO0FBQ0EsSUFBSUEsUUFBNEIsR0FBRyxFQUFuQztBQUVBO0FBQ0E7QUFDQTs7QUFDTyxTQUFTQyxXQUFULENBQXFCQyxTQUFyQixFQUFvRDtBQUN6REYsRUFBQUEsUUFBUSxHQUFHRSxTQUFYO0FBQ0Q7QUFFRDtBQUNBO0FBQ0E7OztBQUNBLGVBQWVDLGlCQUFmLENBQ0VDLE9BREYsRUFFRUMsT0FGRixFQUdFQyxLQUhGLEVBSUVDLE1BSkYsRUFLRUMsT0FMRixFQU1FQyxPQUFlLEdBQUcsQ0FOcEIsRUFPRTtBQUNBLFFBQU07QUFBRUMsSUFBQUEsU0FBRjtBQUFhQyxJQUFBQTtBQUFiLE1BQWdDTixPQUF0QztBQUNBLFFBQU1PLEtBQUssR0FBR0YsU0FBUyxHQUFHLDhCQUFzQkEsU0FBdEIsQ0FBSCxHQUFzQ0csU0FBN0Q7QUFDQSxRQUFNO0FBQUVDLElBQUFBLEdBQUY7QUFBT0MsSUFBQUE7QUFBUCxNQUE2QlgsT0FBbkM7QUFBQSxRQUFzQlksUUFBdEIsMENBQW1DWixPQUFuQztBQUNBLFFBQU1hLFVBQVUsR0FBRyxJQUFJQyx3QkFBSixFQUFuQjtBQUNBLE1BQUlDLEdBQUo7O0FBQ0EsTUFBSTtBQUNGQSxJQUFBQSxHQUFHLEdBQUcsTUFBTSx1Q0FDVixNQUNFLHdCQUFNTCxHQUFOLGdEQUNLRSxRQURMLEdBRU1WLEtBQUssSUFBSSxzQkFBc0JjLElBQXRCLENBQTJCaEIsT0FBTyxDQUFDaUIsTUFBbkMsQ0FBVCxHQUNBO0FBQUVOLE1BQUFBLElBQUksRUFBRVQ7QUFBUixLQURBLEdBRUEsRUFKTjtBQUtFZ0IsTUFBQUEsUUFBUSxFQUFFLFFBTFo7QUFNRUMsTUFBQUEsTUFBTSxFQUFFTixVQUFVLENBQUNNLE1BTnJCO0FBT0VYLE1BQUFBO0FBUEYsT0FGUSxFQVdWUCxPQUFPLENBQUNtQixPQVhFLEVBWVYsTUFBTVAsVUFBVSxDQUFDUSxLQUFYLEVBWkksQ0FBWjtBQWNELEdBZkQsQ0FlRSxPQUFNQyxHQUFOLEVBQVc7QUFDWGxCLElBQUFBLE9BQU8sQ0FBQ21CLElBQVIsQ0FBYSxPQUFiLEVBQXNCRCxHQUF0QjtBQUNBO0FBQ0Q7O0FBQ0QsUUFBTUUsT0FBK0IsR0FBRyxFQUF4Qzs7QUFDQSxPQUFLLE1BQU1DLFVBQVgsSUFBeUIsOEJBQUFWLEdBQUcsQ0FBQ1MsT0FBSixnQkFBekIsRUFBNkM7QUFBQTs7QUFDM0NBLElBQUFBLE9BQU8sQ0FBQ0MsVUFBVSxDQUFDQyxXQUFYLEVBQUQsQ0FBUCxHQUFvQ1gsR0FBRyxDQUFDUyxPQUFKLENBQVlHLEdBQVosQ0FBZ0JGLFVBQWhCLENBQXBDO0FBQ0Q7O0FBQ0QsUUFBTUcsUUFBUSxHQUFHO0FBQ2ZDLElBQUFBLFVBQVUsRUFBRWQsR0FBRyxDQUFDZSxNQUREO0FBRWZOLElBQUFBO0FBRmUsR0FBakI7O0FBSUEsTUFBSWpCLGNBQWMsSUFBSSwrQkFBV3FCLFFBQVEsQ0FBQ0MsVUFBcEIsQ0FBdEIsRUFBdUQ7QUFDckQsUUFBSTtBQUNGLGlEQUNFN0IsT0FERixFQUVFNEIsUUFGRixFQUdFckIsY0FIRixFQUlFRixPQUpGLEVBS0cwQixHQUFELElBQ0VoQyxpQkFBaUIsQ0FDZmdDLEdBRGUsRUFFZjlCLE9BRmUsRUFHZlEsU0FIZSxFQUlmTixNQUplLEVBS2ZDLE9BTGUsRUFNZkMsT0FBTyxHQUFHLENBTkssQ0FOckI7QUFlRCxLQWhCRCxDQWdCRSxPQUFPaUIsR0FBUCxFQUFZO0FBQ1psQixNQUFBQSxPQUFPLENBQUNtQixJQUFSLENBQWEsT0FBYixFQUFzQkQsR0FBdEI7QUFDRDs7QUFDRDtBQUNEOztBQUNEbEIsRUFBQUEsT0FBTyxDQUFDbUIsSUFBUixDQUFhLFVBQWIsRUFBeUJLLFFBQXpCO0FBQ0FiLEVBQUFBLEdBQUcsQ0FBQ0osSUFBSixDQUFTcUIsSUFBVCxDQUFjN0IsTUFBZDtBQUNEO0FBRUQ7QUFDQTtBQUNBOzs7QUFDZSxTQUFTSCxPQUFULENBQ2IrQixHQURhLEVBRWJFLFFBQTRCLEdBQUcsRUFGbEIsRUFHTDtBQUNSLFFBQU1oQyxPQUFPLG1DQUFRTCxRQUFSLEdBQXFCcUMsUUFBckIsQ0FBYjs7QUFDQSxRQUFNO0FBQUUvQixJQUFBQSxLQUFGO0FBQVNDLElBQUFBLE1BQVQ7QUFBaUIrQixJQUFBQTtBQUFqQixNQUE0QixvREFBZ0NILEdBQWhDLENBQWxDO0FBQ0FoQyxFQUFBQSxpQkFBaUIsQ0FBQ2dDLEdBQUQsRUFBTTlCLE9BQU4sRUFBZUMsS0FBZixFQUFzQkMsTUFBdEIsRUFBOEIrQixNQUE5QixDQUFqQjtBQUNBLFNBQU9BLE1BQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBEdXBsZXgsIFJlYWRhYmxlLCBXcml0YWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5pbXBvcnQgQWJvcnRDb250cm9sbGVyIGZyb20gJ2Fib3J0LWNvbnRyb2xsZXInO1xuaW1wb3J0IGNyZWF0ZUh0dHBzUHJveHlBZ2VudCBmcm9tICdodHRwcy1wcm94eS1hZ2VudCc7XG5pbXBvcnQge1xuICBjcmVhdGVIdHRwUmVxdWVzdEhhbmRsZXJTdHJlYW1zLFxuICBleGVjdXRlV2l0aFRpbWVvdXQsXG4gIGlzUmVkaXJlY3QsXG4gIHBlcmZvcm1SZWRpcmVjdFJlcXVlc3QsXG59IGZyb20gJy4vcmVxdWVzdC1oZWxwZXInO1xuaW1wb3J0IHsgSHR0cFJlcXVlc3QsIEh0dHBSZXF1ZXN0T3B0aW9ucyB9IGZyb20gJy4vdHlwZXMnO1xuXG4vKipcbiAqXG4gKi9cbmxldCBkZWZhdWx0czogSHR0cFJlcXVlc3RPcHRpb25zID0ge307XG5cbi8qKlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRzKGRlZmF1bHRzXzogSHR0cFJlcXVlc3RPcHRpb25zKSB7XG4gIGRlZmF1bHRzID0gZGVmYXVsdHNfO1xufVxuXG4vKipcbiAqXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0RmV0Y2hSZXF1ZXN0KFxuICByZXF1ZXN0OiBIdHRwUmVxdWVzdCxcbiAgb3B0aW9uczogSHR0cFJlcXVlc3RPcHRpb25zLFxuICBpbnB1dDogUmVhZGFibGUgfCB1bmRlZmluZWQsXG4gIG91dHB1dDogV3JpdGFibGUsXG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcixcbiAgY291bnRlcjogbnVtYmVyID0gMCxcbikge1xuICBjb25zdCB7IGh0dHBQcm94eSwgZm9sbG93UmVkaXJlY3QgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGFnZW50ID0gaHR0cFByb3h5ID8gY3JlYXRlSHR0cHNQcm94eUFnZW50KGh0dHBQcm94eSkgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHsgdXJsLCBib2R5LCAuLi5ycmVxdWVzdCB9ID0gcmVxdWVzdDtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgbGV0IHJlc1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGV4ZWN1dGVXaXRoVGltZW91dChcbiAgICAgICgpID0+XG4gICAgICAgIGZldGNoKHVybCwge1xuICAgICAgICAgIC4uLnJyZXF1ZXN0LFxuICAgICAgICAgIC4uLihpbnB1dCAmJiAvXihwb3N0fHB1dHxwYXRjaCkkL2kudGVzdChyZXF1ZXN0Lm1ldGhvZClcbiAgICAgICAgICAgID8geyBib2R5OiBpbnB1dCB9XG4gICAgICAgICAgICA6IHt9KSxcbiAgICAgICAgICByZWRpcmVjdDogJ21hbnVhbCcsXG4gICAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgICBhZ2VudCxcbiAgICAgICAgfSksXG4gICAgICBvcHRpb25zLnRpbWVvdXQsXG4gICAgICAoKSA9PiBjb250cm9sbGVyLmFib3J0KCksXG4gICAgKTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICBlbWl0dGVyLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaGVhZGVyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuICBmb3IgKGNvbnN0IGhlYWRlck5hbWUgb2YgcmVzLmhlYWRlcnMua2V5cygpKSB7XG4gICAgaGVhZGVyc1toZWFkZXJOYW1lLnRvTG93ZXJDYXNlKCldID0gcmVzLmhlYWRlcnMuZ2V0KGhlYWRlck5hbWUpO1xuICB9XG4gIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXMsXG4gICAgaGVhZGVycyxcbiAgfTtcbiAgaWYgKGZvbGxvd1JlZGlyZWN0ICYmIGlzUmVkaXJlY3QocmVzcG9uc2Uuc3RhdHVzQ29kZSkpIHtcbiAgICB0cnkge1xuICAgICAgcGVyZm9ybVJlZGlyZWN0UmVxdWVzdChcbiAgICAgICAgcmVxdWVzdCxcbiAgICAgICAgcmVzcG9uc2UsXG4gICAgICAgIGZvbGxvd1JlZGlyZWN0LFxuICAgICAgICBjb3VudGVyLFxuICAgICAgICAocmVxKSA9PlxuICAgICAgICAgIHN0YXJ0RmV0Y2hSZXF1ZXN0KFxuICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIG91dHB1dCxcbiAgICAgICAgICAgIGVtaXR0ZXIsXG4gICAgICAgICAgICBjb3VudGVyICsgMSxcbiAgICAgICAgICApLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgZW1pdHRlci5lbWl0KCdyZXNwb25zZScsIHJlc3BvbnNlKTtcbiAgcmVzLmJvZHkucGlwZShvdXRwdXQpO1xufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlcXVlc3QoXG4gIHJlcTogSHR0cFJlcXVlc3QsXG4gIG9wdGlvbnNfOiBIdHRwUmVxdWVzdE9wdGlvbnMgPSB7fSxcbik6IER1cGxleCB7XG4gIGNvbnN0IG9wdGlvbnMgPSB7IC4uLmRlZmF1bHRzLCAuLi5vcHRpb25zXyB9O1xuICBjb25zdCB7IGlucHV0LCBvdXRwdXQsIHN0cmVhbSB9ID0gY3JlYXRlSHR0cFJlcXVlc3RIYW5kbGVyU3RyZWFtcyhyZXEpO1xuICBzdGFydEZldGNoUmVxdWVzdChyZXEsIG9wdGlvbnMsIGlucHV0LCBvdXRwdXQsIHN0cmVhbSk7XG4gIHJldHVybiBzdHJlYW07XG59XG4iXX0=