"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _filterInstanceProperty2 = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.promise");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.setDefaults = setDefaults;
exports.default = request;

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/trim"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/keys"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/objectWithoutProperties"));

var _requestHelper = require("../request-helper");

var _stream = require("../util/stream");

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) symbols = _filterInstanceProperty2(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; _forEachInstanceProperty(_context3 = ownKeys(Object(source), true)).call(_context3, function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context4; _forEachInstanceProperty(_context4 = ownKeys(Object(source))).call(_context4, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 *
 */
const supportsReadableStream = (() => {
  try {
    if (typeof Request !== 'undefined' && typeof ReadableStream !== 'undefined') {
      return !new Request('', {
        body: new ReadableStream(),
        method: 'POST'
      }).headers.has('Content-Type');
    }
  } catch (e) {
    return false;
  }

  return false;
})();
/**
 *
 */


function toWhatwgReadableStream(ins) {
  return new ReadableStream({
    start(controller) {
      ins.on('data', chunk => controller.enqueue(chunk));
      ins.on('end', () => controller.close());
    }

  });
}
/**
 *
 */


async function readWhatwgReadableStream(rs, outs) {
  const reader = rs.getReader();

  async function readAndWrite() {
    const {
      done,
      value
    } = await reader.read();

    if (done) {
      outs.end();
      return false;
    }

    outs.write(value);
    return true;
  }

  while (await readAndWrite());
}
/**
 *
 */


async function startFetchRequest(request, options, input, output, emitter, counter = 0) {
  const {
    followRedirect
  } = options;
  const {
    url,
    body: reqBody
  } = request,
        rreq = (0, _objectWithoutProperties2.default)(request, ["url", "body"]);
  const body = input && /^(post|put|patch)$/i.test(request.method) ? supportsReadableStream ? toWhatwgReadableStream(input) : await (0, _stream.readAll)(input) : undefined;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const res = await (0, _requestHelper.executeWithTimeout)(() => fetch(url, _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, rreq), body ? {
    body
  } : {}), {}, {
    redirect: 'manual'
  }, controller ? {
    signal: controller.signal
  } : {}), {
    allowHTTP1ForStreamingUpload: true
  })), options.timeout, () => controller === null || controller === void 0 ? void 0 : controller.abort());
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

  if (res.body) {
    readWhatwgReadableStream(res.body, output);
  } else {
    output.end();
  }
}
/**
 *
 */


function getResponseHeaderNames(xhr) {
  var _context2;

  const headerLines = (0, _filter.default)(_context2 = (xhr.getAllResponseHeaders() || '').split(/[\r\n]+/)).call(_context2, l => (0, _trim.default)(l).call(l) !== '');
  return (0, _map.default)(headerLines).call(headerLines, headerLine => headerLine.split(/\s*:/)[0].toLowerCase());
}
/**
 *
 */


async function startXmlHttpRequest(request, options, input, output, emitter, counter = 0) {
  const {
    method,
    url,
    headers: reqHeaders
  } = request;
  const {
    followRedirect
  } = options;
  const reqBody = input && /^(post|put|patch)$/i.test(method) ? await (0, _stream.readAll)(input) : null;
  const xhr = new XMLHttpRequest();
  await (0, _requestHelper.executeWithTimeout)(() => {
    xhr.open(method, url);

    if (reqHeaders) {
      for (const header in reqHeaders) {
        xhr.setRequestHeader(header, reqHeaders[header]);
      }
    }

    if (options.timeout) {
      xhr.timeout = options.timeout;
    }

    xhr.responseType = 'arraybuffer';
    xhr.send(reqBody);
    return new _promise.default((resolve, reject) => {
      xhr.onload = () => resolve();

      xhr.onerror = reject;
      xhr.ontimeout = reject;
      xhr.onabort = reject;
    });
  }, options.timeout, () => xhr.abort());
  const headerNames = getResponseHeaderNames(xhr);
  const headers = (0, _reduce.default)(headerNames).call(headerNames, (headers, headerName) => _objectSpread(_objectSpread({}, headers), {}, {
    [headerName]: xhr.getResponseHeader(headerName) || ''
  }), {});
  const response = {
    statusCode: xhr.status,
    headers: headers
  };

  if (followRedirect && (0, _requestHelper.isRedirect)(response.statusCode)) {
    try {
      (0, _requestHelper.performRedirectRequest)(request, response, followRedirect, counter, req => startXmlHttpRequest(req, options, undefined, output, emitter, counter + 1));
    } catch (err) {
      emitter.emit('error', err);
    }

    return;
  }

  let body;

  if (!response.statusCode) {
    response.statusCode = 400;
    body = Buffer.from('Access Declined');
  } else {
    body = Buffer.from(xhr.response);
  }

  emitter.emit('response', response);
  output.write(body);
  output.end();
}
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


function request(req, options_ = {}) {
  const options = _objectSpread(_objectSpread({}, defaults), options_);

  const {
    input,
    output,
    stream
  } = (0, _requestHelper.createHttpRequestHandlerStreams)(req);

  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    startFetchRequest(req, options, input, output, stream);
  } else {
    startXmlHttpRequest(req, options, input, output, stream);
  }

  return stream;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9icm93c2VyL3JlcXVlc3QudHMiXSwibmFtZXMiOlsic3VwcG9ydHNSZWFkYWJsZVN0cmVhbSIsIlJlcXVlc3QiLCJSZWFkYWJsZVN0cmVhbSIsImJvZHkiLCJtZXRob2QiLCJoZWFkZXJzIiwiaGFzIiwiZSIsInRvV2hhdHdnUmVhZGFibGVTdHJlYW0iLCJpbnMiLCJzdGFydCIsImNvbnRyb2xsZXIiLCJvbiIsImNodW5rIiwiZW5xdWV1ZSIsImNsb3NlIiwicmVhZFdoYXR3Z1JlYWRhYmxlU3RyZWFtIiwicnMiLCJvdXRzIiwicmVhZGVyIiwiZ2V0UmVhZGVyIiwicmVhZEFuZFdyaXRlIiwiZG9uZSIsInZhbHVlIiwicmVhZCIsImVuZCIsIndyaXRlIiwic3RhcnRGZXRjaFJlcXVlc3QiLCJyZXF1ZXN0Iiwib3B0aW9ucyIsImlucHV0Iiwib3V0cHV0IiwiZW1pdHRlciIsImNvdW50ZXIiLCJmb2xsb3dSZWRpcmVjdCIsInVybCIsInJlcUJvZHkiLCJycmVxIiwidGVzdCIsInVuZGVmaW5lZCIsIkFib3J0Q29udHJvbGxlciIsInJlcyIsImZldGNoIiwicmVkaXJlY3QiLCJzaWduYWwiLCJhbGxvd0hUVFAxRm9yU3RyZWFtaW5nVXBsb2FkIiwidGltZW91dCIsImFib3J0IiwiaGVhZGVyTmFtZSIsInRvTG93ZXJDYXNlIiwiZ2V0IiwicmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic3RhdHVzIiwicmVxIiwiZXJyIiwiZW1pdCIsImdldFJlc3BvbnNlSGVhZGVyTmFtZXMiLCJ4aHIiLCJoZWFkZXJMaW5lcyIsImdldEFsbFJlc3BvbnNlSGVhZGVycyIsInNwbGl0IiwibCIsImhlYWRlckxpbmUiLCJzdGFydFhtbEh0dHBSZXF1ZXN0IiwicmVxSGVhZGVycyIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsImhlYWRlciIsInNldFJlcXVlc3RIZWFkZXIiLCJyZXNwb25zZVR5cGUiLCJzZW5kIiwicmVzb2x2ZSIsInJlamVjdCIsIm9ubG9hZCIsIm9uZXJyb3IiLCJvbnRpbWVvdXQiLCJvbmFib3J0IiwiaGVhZGVyTmFtZXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIkJ1ZmZlciIsImZyb20iLCJkZWZhdWx0cyIsInNldERlZmF1bHRzIiwiZGVmYXVsdHNfIiwib3B0aW9uc18iLCJzdHJlYW0iLCJ3aW5kb3ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBTUE7Ozs7OztBQUdBO0FBQ0E7QUFDQTtBQUNBLE1BQU1BLHNCQUFzQixHQUFHLENBQUMsTUFBTTtBQUNwQyxNQUFJO0FBQ0YsUUFDRSxPQUFPQyxPQUFQLEtBQW1CLFdBQW5CLElBQ0EsT0FBT0MsY0FBUCxLQUEwQixXQUY1QixFQUdFO0FBQ0EsYUFBTyxDQUFDLElBQUlELE9BQUosQ0FBWSxFQUFaLEVBQWdCO0FBQ3RCRSxRQUFBQSxJQUFJLEVBQUUsSUFBSUQsY0FBSixFQURnQjtBQUV0QkUsUUFBQUEsTUFBTSxFQUFFO0FBRmMsT0FBaEIsRUFHTEMsT0FISyxDQUdHQyxHQUhILENBR08sY0FIUCxDQUFSO0FBSUQ7QUFDRixHQVZELENBVUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1YsV0FBTyxLQUFQO0FBQ0Q7O0FBQ0QsU0FBTyxLQUFQO0FBQ0QsQ0FmOEIsR0FBL0I7QUFpQkE7QUFDQTtBQUNBOzs7QUFDQSxTQUFTQyxzQkFBVCxDQUFnQ0MsR0FBaEMsRUFBK0Q7QUFDN0QsU0FBTyxJQUFJUCxjQUFKLENBQW1CO0FBQ3hCUSxJQUFBQSxLQUFLLENBQUNDLFVBQUQsRUFBYTtBQUNoQkYsTUFBQUEsR0FBRyxDQUFDRyxFQUFKLENBQU8sTUFBUCxFQUFnQkMsS0FBRCxJQUFXRixVQUFVLENBQUNHLE9BQVgsQ0FBbUJELEtBQW5CLENBQTFCO0FBQ0FKLE1BQUFBLEdBQUcsQ0FBQ0csRUFBSixDQUFPLEtBQVAsRUFBYyxNQUFNRCxVQUFVLENBQUNJLEtBQVgsRUFBcEI7QUFDRDs7QUFKdUIsR0FBbkIsQ0FBUDtBQU1EO0FB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Q0wsS0FBUCxDQUFhdkIsSUFBYjtBQUNBNEIsRUFBQUEsTUFBTSxDQUFDTixHQUFQO0FBQ0Q7QUFFRDtBQUNBO0FBQ0E7OztBQUNBLElBQUl5RCxRQUE0QixHQUFHLEVBQW5DO0FBRUE7QUFDQTtBQUNBOztBQUNPLFNBQVNDLFdBQVQsQ0FBcUJDLFNBQXJCLEVBQW9EO0FBQ3pERixFQUFBQSxRQUFRLEdBQUdFLFNBQVg7QUFDRDtBQUVEO0FBQ0E7QUFDQTs7O0FBQ2UsU0FBU3hELE9BQVQsQ0FDYjBCLEdBRGEsRUFFYitCLFFBQTRCLEdBQUcsRUFGbEIsRUFHYjtBQUNBLFFBQU14RCxPQUFPLG1DQUFRcUQsUUFBUixHQUFxQkcsUUFBckIsQ0FBYjs7QUFDQSxRQUFNO0FBQUV2RCxJQUFBQSxLQUFGO0FBQVNDLElBQUFBLE1BQVQ7QUFBaUJ1RCxJQUFBQTtBQUFqQixNQUE0QixvREFBZ0NoQyxHQUFoQyxDQUFsQzs7QUFDQSxNQUFJLE9BQU9pQyxNQUFQLEtBQWtCLFdBQWxCLElBQWlDLE9BQU9BLE1BQU0sQ0FBQzdDLEtBQWQsS0FBd0IsVUFBN0QsRUFBeUU7QUFDdkVmLElBQUFBLGlCQUFpQixDQUFDMkIsR0FBRCxFQUFNekIsT0FBTixFQUFlQyxLQUFmLEVBQXNCQyxNQUF0QixFQUE4QnVELE1BQTlCLENBQWpCO0FBQ0QsR0FGRCxNQUVPO0FBQ0x0QixJQUFBQSxtQkFBbUIsQ0FBQ1YsR0FBRCxFQUFNekIsT0FBTixFQUFlQyxLQUFmLEVBQXNCQyxNQUF0QixFQUE4QnVELE1BQTlCLENBQW5CO0FBQ0Q7O0FBQ0QsU0FBT0EsTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IFJlYWRhYmxlLCBXcml0YWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge1xuICBjcmVhdGVIdHRwUmVxdWVzdEhhbmRsZXJTdHJlYW1zLFxuICBleGVjdXRlV2l0aFRpbWVvdXQsXG4gIGlzUmVkaXJlY3QsXG4gIHBlcmZvcm1SZWRpcmVjdFJlcXVlc3QsXG59IGZyb20gJy4uL3JlcXVlc3QtaGVscGVyJztcbmltcG9ydCB7IHJlYWRBbGwgfSBmcm9tICcuLi91dGlsL3N0cmVhbSc7XG5pbXBvcnQgeyBIdHRwUmVxdWVzdCwgSHR0cFJlcXVlc3RPcHRpb25zIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKipcbiAqXG4gKi9cbmNvbnN0IHN1cHBvcnRzUmVhZGFibGVTdHJlYW0gPSAoKCkgPT4ge1xuICB0cnkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIFJlYWRhYmxlU3RyZWFtICE9PSAndW5kZWZpbmVkJ1xuICAgICkge1xuICAgICAgcmV0dXJuICFuZXcgUmVxdWVzdCgnJywge1xuICAgICAgICBib2R5OiBuZXcgUmVhZGFibGVTdHJlYW0oKSxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB9KS5oZWFkZXJzLmhhcygnQ29udGVudC1UeXBlJyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn0pKCk7XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gdG9XaGF0d2dSZWFkYWJsZVN0cmVhbShpbnM6IFJlYWRhYmxlKTogUmVhZGFibGVTdHJlYW0ge1xuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtKHtcbiAgICBzdGFydChjb250cm9sbGVyKSB7XG4gICAgICBpbnMub24oJ2RhdGEnLCAoY2h1bmspID0+IGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuaykpO1xuICAgICAgaW5zLm9uKCdlbmQnLCAoKSA9PiBjb250cm9sbGVyLmNsb3NlKCkpO1xuICAgIH0sXG4gIH0pO1xufVxuXG4vKipcbiAqXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlYWRXaGF0d2dSZWFkYWJsZVN0cmVhbShyczogUmVhZGFibGVTdHJlYW0sIG91dHM6IFdyaXRhYmxlKSB7XG4gIGNvbnN0IHJlYWRlciA9IHJzLmdldFJlYWRlcigpO1xuICBhc3luYyBmdW5jdGlvbiByZWFkQW5kV3JpdGUoKSB7XG4gICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICBpZiAoZG9uZSkge1xuICAgICAgb3V0cy5lbmQoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgb3V0cy53cml0ZSh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgd2hpbGUgKGF3YWl0IHJlYWRBbmRXcml0ZSgpKTtcbn1cblxuLyoqXG4gKlxuICovXG5hc3luYyBmdW5jdGlvbiBzdGFydEZldGNoUmVxdWVzdChcbiAgcmVxdWVzdDogSHR0cFJlcXVlc3QsXG4gIG9wdGlvbnM6IEh0dHBSZXF1ZXN0T3B0aW9ucyxcbiAgaW5wdXQ6IFJlYWRhYmxlIHwgdW5kZWZpbmVkLFxuICBvdXRwdXQ6IFdyaXRhYmxlLFxuICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gIGNvdW50ZXI6IG51bWJlciA9IDAsXG4pIHtcbiAgY29uc3QgeyBmb2xsb3dSZWRpcmVjdCB9ID0gb3B0aW9ucztcbiAgY29uc3QgeyB1cmwsIGJvZHk6IHJlcUJvZHksIC4uLnJyZXEgfSA9IHJlcXVlc3Q7XG4gIGNvbnN0IGJvZHkgPVxuICAgIGlucHV0ICYmIC9eKHBvc3R8cHV0fHBhdGNoKSQvaS50ZXN0KHJlcXVlc3QubWV0aG9kKVxuICAgICAgPyBzdXBwb3J0c1JlYWRhYmxlU3RyZWFtXG4gICAgICAgID8gdG9XaGF0d2dSZWFkYWJsZVN0cmVhbShpbnB1dClcbiAgICAgICAgOiBhd2FpdCByZWFkQWxsKGlucHV0KVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPVxuICAgIHR5cGVvZiBBYm9ydENvbnRyb2xsZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IEFib3J0Q29udHJvbGxlcigpIDogdW5kZWZpbmVkO1xuICBjb25zdCByZXMgPSBhd2FpdCBleGVjdXRlV2l0aFRpbWVvdXQoXG4gICAgKCkgPT5cbiAgICAgIGZldGNoKHVybCwge1xuICAgICAgICAuLi5ycmVxLFxuICAgICAgICAuLi4oYm9keSA/IHsgYm9keSB9IDoge30pLFxuICAgICAgICByZWRpcmVjdDogJ21hbnVhbCcsXG4gICAgICAgIC4uLihjb250cm9sbGVyID8geyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0gOiB7fSksXG4gICAgICAgIC4uLih7IGFsbG93SFRUUDFGb3JTdHJlYW1pbmdVcGxvYWQ6IHRydWUgfSBhcyBhbnkpLCAvLyBDaHJvbWUgYWxsb3dzIHJlcXVlc3Qgc3RyZWFtIG9ubHkgaW4gSFRUUDIvUVVJQyB1bmxlc3MgdGhpcyBvcHQtaW4gZmxhZ1xuICAgICAgfSksXG4gICAgb3B0aW9ucy50aW1lb3V0LFxuICAgICgpID0+IGNvbnRyb2xsZXI/LmFib3J0KCksXG4gICk7XG4gIGNvbnN0IGhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcbiAgZm9yIChjb25zdCBoZWFkZXJOYW1lIG9mIHJlcy5oZWFkZXJzLmtleXMoKSkge1xuICAgIGhlYWRlcnNbaGVhZGVyTmFtZS50b0xvd2VyQ2FzZSgpXSA9IHJlcy5oZWFkZXJzLmdldChoZWFkZXJOYW1lKTtcbiAgfVxuICBjb25zdCByZXNwb25zZSA9IHtcbiAgICBzdGF0dXNDb2RlOiByZXMuc3RhdHVzLFxuICAgIGhlYWRlcnMsXG4gIH07XG4gIGlmIChmb2xsb3dSZWRpcmVjdCAmJiBpc1JlZGlyZWN0KHJlc3BvbnNlLnN0YXR1c0NvZGUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHBlcmZvcm1SZWRpcmVjdFJlcXVlc3QoXG4gICAgICAgIHJlcXVlc3QsXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBmb2xsb3dSZWRpcmVjdCxcbiAgICAgICAgY291bnRlcixcbiAgICAgICAgKHJlcSkgPT5cbiAgICAgICAgICBzdGFydEZldGNoUmVxdWVzdChcbiAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgICBlbWl0dGVyLFxuICAgICAgICAgICAgY291bnRlciArIDEsXG4gICAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBlbWl0dGVyLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGVtaXR0ZXIuZW1pdCgncmVzcG9uc2UnLCByZXNwb25zZSk7XG4gIGlmIChyZXMuYm9keSkge1xuICAgIHJlYWRXaGF0d2dSZWFkYWJsZVN0cmVhbShyZXMuYm9keSwgb3V0cHV0KTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBnZXRSZXNwb25zZUhlYWRlck5hbWVzKHhocjogWE1MSHR0cFJlcXVlc3QpIHtcbiAgY29uc3QgaGVhZGVyTGluZXMgPSAoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgIC5zcGxpdCgvW1xcclxcbl0rLylcbiAgICAuZmlsdGVyKChsKSA9PiBsLnRyaW0oKSAhPT0gJycpO1xuICByZXR1cm4gaGVhZGVyTGluZXMubWFwKChoZWFkZXJMaW5lKSA9PlxuICAgIGhlYWRlckxpbmUuc3BsaXQoL1xccyo6LylbMF0udG9Mb3dlckNhc2UoKSxcbiAgKTtcbn1cblxuLyoqXG4gKlxuICovXG5hc3luYyBmdW5jdGlvbiBzdGFydFhtbEh0dHBSZXF1ZXN0KFxuICByZXF1ZXN0OiBIdHRwUmVxdWVzdCxcbiAgb3B0aW9uczogSHR0cFJlcXVlc3RPcHRpb25zLFxuICBpbnB1dDogUmVhZGFibGUgfCB1bmRlZmluZWQsXG4gIG91dHB1dDogV3JpdGFibGUsXG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcixcbiAgY291bnRlcjogbnVtYmVyID0gMCxcbikge1xuICBjb25zdCB7IG1ldGhvZCwgdXJsLCBoZWFkZXJzOiByZXFIZWFkZXJzIH0gPSByZXF1ZXN0O1xuICBjb25zdCB7IGZvbGxvd1JlZGlyZWN0IH0gPSBvcHRpb25zO1xuICBjb25zdCByZXFCb2R5ID1cbiAgICBpbnB1dCAmJiAvXihwb3N0fHB1dHxwYXRjaCkkL2kudGVzdChtZXRob2QpID8gYXdhaXQgcmVhZEFsbChpbnB1dCkgOiBudWxsO1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgYXdhaXQgZXhlY3V0ZVdpdGhUaW1lb3V0KFxuICAgICgpID0+IHtcbiAgICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsKTtcbiAgICAgIGlmIChyZXFIZWFkZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGVhZGVyIGluIHJlcUhlYWRlcnMpIHtcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHJlcUhlYWRlcnNbaGVhZGVyXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnRpbWVvdXQpIHtcbiAgICAgICAgeGhyLnRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQ7XG4gICAgICB9XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgIHhoci5zZW5kKHJlcUJvZHkpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgeGhyLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgeGhyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSByZWplY3Q7XG4gICAgICAgIHhoci5vbmFib3J0ID0gcmVqZWN0O1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBvcHRpb25zLnRpbWVvdXQsXG4gICAgKCkgPT4geGhyLmFib3J0KCksXG4gICk7XG4gIGNvbnN0IGhlYWRlck5hbWVzID0gZ2V0UmVzcG9uc2VIZWFkZXJOYW1lcyh4aHIpO1xuICBjb25zdCBoZWFkZXJzID0gaGVhZGVyTmFtZXMucmVkdWNlKFxuICAgIChoZWFkZXJzLCBoZWFkZXJOYW1lKSA9PiAoe1xuICAgICAgLi4uaGVhZGVycyxcbiAgICAgIFtoZWFkZXJOYW1lXTogeGhyLmdldFJlc3BvbnNlSGVhZGVyKGhlYWRlck5hbWUpIHx8ICcnLFxuICAgIH0pLFxuICAgIHt9IGFzIHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9LFxuICApO1xuICBjb25zdCByZXNwb25zZSA9IHtcbiAgICBzdGF0dXNDb2RlOiB4aHIuc3RhdHVzLFxuICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gIH07XG4gIGlmIChmb2xsb3dSZWRpcmVjdCAmJiBpc1JlZGlyZWN0KHJlc3BvbnNlLnN0YXR1c0NvZGUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHBlcmZvcm1SZWRpcmVjdFJlcXVlc3QoXG4gICAgICAgIHJlcXVlc3QsXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBmb2xsb3dSZWRpcmVjdCxcbiAgICAgICAgY291bnRlcixcbiAgICAgICAgKHJlcSkgPT5cbiAgICAgICAgICBzdGFydFhtbEh0dHBSZXF1ZXN0KFxuICAgICAgICAgICAgcmVxLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIG91dHB1dCxcbiAgICAgICAgICAgIGVtaXR0ZXIsXG4gICAgICAgICAgICBjb3VudGVyICsgMSxcbiAgICAgICAgICApLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGJvZHk6IEJ1ZmZlcjtcbiAgaWYgKCFyZXNwb25zZS5zdGF0dXNDb2RlKSB7XG4gICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICBib2R5ID0gQnVmZmVyLmZyb20oJ0FjY2VzcyBEZWNsaW5lZCcpO1xuICB9IGVsc2Uge1xuICAgIGJvZHkgPSBCdWZmZXIuZnJvbSh4aHIucmVzcG9uc2UpO1xuICB9XG4gIGVtaXR0ZXIuZW1pdCgncmVzcG9uc2UnLCByZXNwb25zZSk7XG4gIG91dHB1dC53cml0ZShib2R5KTtcbiAgb3V0cHV0LmVuZCgpO1xufVxuXG4vKipcbiAqXG4gKi9cbmxldCBkZWZhdWx0czogSHR0cFJlcXVlc3RPcHRpb25zID0ge307XG5cbi8qKlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRzKGRlZmF1bHRzXzogSHR0cFJlcXVlc3RPcHRpb25zKSB7XG4gIGRlZmF1bHRzID0gZGVmYXVsdHNfO1xufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlcXVlc3QoXG4gIHJlcTogSHR0cFJlcXVlc3QsXG4gIG9wdGlvbnNfOiBIdHRwUmVxdWVzdE9wdGlvbnMgPSB7fSxcbikge1xuICBjb25zdCBvcHRpb25zID0geyAuLi5kZWZhdWx0cywgLi4ub3B0aW9uc18gfTtcbiAgY29uc3QgeyBpbnB1dCwgb3V0cHV0LCBzdHJlYW0gfSA9IGNyZWF0ZUh0dHBSZXF1ZXN0SGFuZGxlclN0cmVhbXMocmVxKTtcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZmV0Y2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICBzdGFydEZldGNoUmVxdWVzdChyZXEsIG9wdGlvbnMsIGlucHV0LCBvdXRwdXQsIHN0cmVhbSk7XG4gIH0gZWxzZSB7XG4gICAgc3RhcnRYbWxIdHRwUmVxdWVzdChyZXEsIG9wdGlvbnMsIGlucHV0LCBvdXRwdXQsIHN0cmVhbSk7XG4gIH1cbiAgcmV0dXJuIHN0cmVhbTtcbn1cbiJdfQ==