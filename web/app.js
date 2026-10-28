(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // node_modules/@yume-chan/async/esm/promise-resolver.js
  var _promise, _resolve, _reject, _state;
  var PromiseResolver = class {
    constructor() {
      __privateAdd(this, _promise);
      __privateAdd(this, _resolve);
      __privateAdd(this, _reject);
      __privateAdd(this, _state, "running");
      __publicField(this, "resolve", (value) => {
        __privateGet(this, _resolve).call(this, value);
        __privateSet(this, _state, "resolved");
      });
      __publicField(this, "reject", (reason) => {
        __privateGet(this, _reject).call(this, reason);
        __privateSet(this, _state, "rejected");
      });
      __privateSet(this, _promise, new Promise((resolve, reject) => {
        __privateSet(this, _resolve, resolve);
        __privateSet(this, _reject, reject);
      }));
    }
    get promise() {
      return __privateGet(this, _promise);
    }
    get state() {
      return __privateGet(this, _state);
    }
  };
  _promise = new WeakMap();
  _resolve = new WeakMap();
  _reject = new WeakMap();
  _state = new WeakMap();

  // node_modules/@yume-chan/async/esm/async-operation-manager.js
  var AsyncOperationManager = class {
    constructor(startId = 0) {
      __publicField(this, "nextId");
      __publicField(this, "pendingResolvers", /* @__PURE__ */ new Map());
      this.nextId = startId;
    }
    add() {
      const id = this.nextId++;
      const resolver = new PromiseResolver();
      this.pendingResolvers.set(id, resolver);
      return [id, resolver.promise];
    }
    getResolver(id) {
      if (!this.pendingResolvers.has(id)) {
        return null;
      }
      const resolver = this.pendingResolvers.get(id);
      this.pendingResolvers.delete(id);
      return resolver;
    }
    resolve(id, result) {
      const resolver = this.getResolver(id);
      if (resolver !== null) {
        resolver.resolve(result);
        return true;
      }
      return false;
    }
    reject(id, reason) {
      const resolver = this.getResolver(id);
      if (resolver !== null) {
        resolver.reject(reason);
        return true;
      }
      return false;
    }
  };

  // node_modules/@yume-chan/async/esm/delay.js
  function delay(time) {
    return new Promise((resolve) => {
      globalThis.setTimeout(() => resolve(), time);
    });
  }

  // node_modules/@yume-chan/async/esm/maybe-promise.js
  function isPromiseLike(value) {
    return typeof value === "object" && value !== null && "then" in value;
  }

  // node_modules/@yume-chan/struct/esm/bipedal.js
  function advance(iterator, next) {
    while (true) {
      const { done, value } = iterator.next(next);
      if (done) {
        return value;
      }
      if (isPromiseLike(value)) {
        return value.then((value2) => advance(iterator, { resolved: value2 }), (error) => advance(iterator, { error }));
      }
      next = value;
    }
  }
  // @__NO_SIDE_EFFECTS__
  function bipedal(fn, bindThis) {
    function result(...args) {
      const iterator = fn.call(this, function* (value) {
        if (isPromiseLike(value)) {
          const result2 = yield value;
          if ("resolved" in result2) {
            return result2.resolved;
          } else {
            throw result2.error;
          }
        }
        return value;
      }, ...args);
      return advance(iterator, void 0);
    }
    if (bindThis) {
      return result.bind(bindThis);
    } else {
      return result;
    }
  }

  // node_modules/@yume-chan/struct/esm/field/serialize.js
  function defaultFieldSerializer(serializer) {
    return (source, context) => {
      if ("buffer" in context) {
        const buffer2 = serializer(source, context);
        context.buffer.set(buffer2, context.index);
        return buffer2.length;
      } else {
        return serializer(source, context);
      }
    };
  }
  function byobFieldSerializer(size, serializer) {
    return (source, context) => {
      if ("buffer" in context) {
        context.index ?? (context.index = 0);
        serializer(source, context);
        return size;
      } else {
        const buffer2 = new Uint8Array(size);
        serializer(source, {
          buffer: buffer2,
          index: 0,
          littleEndian: context.littleEndian
        });
        return buffer2;
      }
    };
  }

  // node_modules/@yume-chan/struct/esm/field/factory.js
  // @__NO_SIDE_EFFECTS__
  function _field(size, type, serialize, deserialize, options) {
    const field2 = {
      size,
      type,
      serialize: type === "default" ? defaultFieldSerializer(serialize) : byobFieldSerializer(size, serialize),
      deserialize: bipedal(deserialize),
      omitInit: options?.omitInit
    };
    if (options?.init) {
      field2.init = options.init;
    }
    return field2;
  }
  var field = _field;

  // node_modules/@yume-chan/struct/esm/buffer.js
  var EmptyUint8Array = new Uint8Array(0);
  function copyMaybeDifferentLength(dest, source, index, length) {
    if (source.length < length) {
      dest.set(source, index);
      dest.fill(0, index + source.length, index + length);
    } else if (source.length === length) {
      dest.set(source, index);
    } else {
      dest.set(source.subarray(0, length), index);
    }
  }
  // @__NO_SIDE_EFFECTS__
  function buffer(lengthOrField, converter) {
    if (typeof lengthOrField === "number") {
      let serialize;
      let deserialize2;
      let init3;
      if (lengthOrField === 0) {
        serialize = () => {
        };
        if (converter) {
          deserialize2 = function* () {
            return converter.convert(EmptyUint8Array);
          };
        } else {
          deserialize2 = function* () {
            return EmptyUint8Array;
          };
        }
      } else {
        serialize = (value, { buffer: buffer2, index }) => copyMaybeDifferentLength(buffer2, value, index, lengthOrField);
        if (converter) {
          deserialize2 = function* (then, reader) {
            const array = reader.readExactly(lengthOrField);
            return converter.convert(yield* then(array));
          };
          init3 = (value) => converter.back(value);
        } else {
          deserialize2 = function* (_then, reader) {
            const array = reader.readExactly(lengthOrField);
            return array;
          };
        }
      }
      return field(lengthOrField, "byob", serialize, deserialize2, { init: init3 });
    }
    if ((typeof lengthOrField === "object" || typeof lengthOrField === "function") && "serialize" in lengthOrField) {
      let deserialize2;
      let init3;
      if (converter) {
        deserialize2 = function* (then, reader, context) {
          const length = yield* then(lengthOrField.deserialize(reader, context));
          const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
          return converter.convert(yield* then(array));
        };
        init3 = (value) => converter.back(value);
      } else {
        deserialize2 = function* (then, reader, context) {
          const length = yield* then(lengthOrField.deserialize(reader, context));
          const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
          return array;
        };
      }
      return field(lengthOrField.size, "default", (value, { littleEndian }) => {
        if (lengthOrField.type === "default") {
          const lengthBuffer = lengthOrField.serialize(value.length, {
            littleEndian
          });
          if (value.length === 0) {
            return lengthBuffer;
          }
          const result = new Uint8Array(lengthBuffer.length + value.length);
          result.set(lengthBuffer, 0);
          result.set(value, lengthBuffer.length);
          return result;
        } else {
          const result = new Uint8Array(lengthOrField.size + value.length);
          lengthOrField.serialize(value.length, {
            buffer: result,
            index: 0,
            littleEndian
          });
          result.set(value, lengthOrField.size);
          return result;
        }
      }, deserialize2, { init: init3 });
    }
    if (typeof lengthOrField === "string") {
      let deserialize2;
      let init3;
      if (converter) {
        deserialize2 = function* (then, reader, { dependencies }) {
          const length = dependencies[lengthOrField];
          const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
          return converter.convert(yield* then(array));
        };
        init3 = (value, dependencies) => {
          const array = converter.back(value);
          dependencies[lengthOrField] = array.length;
          return array;
        };
      } else {
        deserialize2 = function* (_then, reader, { dependencies }) {
          const length = dependencies[lengthOrField];
          const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
          return array;
        };
        init3 = (value, dependencies) => {
          const array = value;
          dependencies[lengthOrField] = array.length;
          return array;
        };
      }
      return field(0, "default", (source) => source, deserialize2, { init: init3 });
    }
    let deserialize;
    let init2;
    if (converter) {
      deserialize = function* (then, reader, { dependencies }) {
        const rawLength = dependencies[lengthOrField.field];
        const length = lengthOrField.convert(rawLength);
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return converter.convert(yield* then(array));
      };
      init2 = (value, dependencies) => {
        const array = converter.back(value);
        dependencies[lengthOrField.field] = lengthOrField.back(array.length);
        return array;
      };
    } else {
      deserialize = function* (_then, reader, { dependencies }) {
        const rawLength = dependencies[lengthOrField.field];
        const length = lengthOrField.convert(rawLength);
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return array;
      };
      init2 = (value, dependencies) => {
        const array = value;
        dependencies[lengthOrField.field] = lengthOrField.back(array.length);
        return array;
      };
    }
    return field(0, "default", (source) => source, deserialize, { init: init2 });
  }

  // node_modules/@yume-chan/struct/esm/readable.js
  var ExactReadableEndedError = class extends Error {
    constructor() {
      super("ExactReadable ended");
    }
  };
  var _data, _position;
  var Uint8ArrayExactReadable = class {
    constructor(data) {
      __privateAdd(this, _data);
      __privateAdd(this, _position);
      __privateSet(this, _data, data);
      __privateSet(this, _position, 0);
    }
    get position() {
      return __privateGet(this, _position);
    }
    readExactly(length) {
      if (__privateGet(this, _position) + length > __privateGet(this, _data).length) {
        throw new ExactReadableEndedError();
      }
      const result = __privateGet(this, _data).subarray(__privateGet(this, _position), __privateGet(this, _position) + length);
      __privateSet(this, _position, __privateGet(this, _position) + length);
      return result;
    }
  };
  _data = new WeakMap();
  _position = new WeakMap();

  // node_modules/@yume-chan/struct/esm/struct.js
  var StructDeserializeError = class extends Error {
    constructor(message) {
      super(message);
    }
  };
  var StructNotEnoughDataError = class extends StructDeserializeError {
    constructor() {
      super("The underlying readable was ended before the struct was fully deserialized");
    }
  };
  var StructEmptyError = class extends StructDeserializeError {
    constructor() {
      super("The underlying readable doesn't contain any more struct");
    }
  };
  // @__NO_SIDE_EFFECTS__
  function struct(fields, options) {
    const fieldList = Object.entries(fields);
    let size = 0;
    let byob = true;
    for (const [, field2] of fieldList) {
      size += field2.size;
      if (byob && field2.type !== "byob") {
        byob = false;
      }
    }
    const littleEndian = options.littleEndian;
    const extra = options.extra ? Object.getOwnPropertyDescriptors(options.extra) : void 0;
    return {
      littleEndian,
      fields,
      extra: options.extra,
      type: byob ? "byob" : "default",
      size,
      serialize(source, bufferOrContext) {
        const temp = { ...source };
        for (const [key, field2] of fieldList) {
          if (key in temp && "init" in field2) {
            const result = field2.init?.(temp[key], temp);
            temp[key] = result;
          }
        }
        const sizes = new Array(fieldList.length);
        const buffers = new Array(fieldList.length);
        {
          const context2 = { littleEndian };
          for (const [index2, [key, field2]] of fieldList.entries()) {
            if (field2.type === "byob") {
              sizes[index2] = field2.size;
            } else {
              buffers[index2] = field2.serialize(temp[key], context2);
              sizes[index2] = buffers[index2].length;
            }
          }
        }
        const size2 = sizes.reduce((sum, size3) => sum + size3, 0);
        let externalBuffer;
        let buffer2;
        let index;
        if (bufferOrContext instanceof Uint8Array) {
          if (bufferOrContext.length < size2) {
            throw new Error("Buffer too small");
          }
          externalBuffer = true;
          buffer2 = bufferOrContext;
          index = 0;
        } else if (typeof bufferOrContext === "object" && "buffer" in bufferOrContext) {
          externalBuffer = true;
          buffer2 = bufferOrContext.buffer;
          index = bufferOrContext.index ?? 0;
          if (buffer2.length - index < size2) {
            throw new Error("Buffer too small");
          }
        } else {
          externalBuffer = false;
          buffer2 = new Uint8Array(size2);
          index = 0;
        }
        const context = {
          buffer: buffer2,
          index,
          littleEndian
        };
        for (const [index2, [key, field2]] of fieldList.entries()) {
          if (buffers[index2]) {
            buffer2.set(buffers[index2], context.index);
          } else {
            field2.serialize(temp[key], context);
          }
          context.index += sizes[index2];
        }
        if (externalBuffer) {
          return size2;
        } else {
          return buffer2;
        }
      },
      deserialize: bipedal(function* (then, reader) {
        const startPosition = reader.position;
        const result = {};
        const context = {
          dependencies: result,
          littleEndian
        };
        try {
          for (const [key, field2] of fieldList) {
            result[key] = yield* then(field2.deserialize(reader, context));
          }
        } catch (e) {
          if (!(e instanceof ExactReadableEndedError)) {
            throw e;
          }
          if (reader.position === startPosition) {
            throw new StructEmptyError();
          } else {
            throw new StructNotEnoughDataError();
          }
        }
        if (extra) {
          Object.defineProperties(result, extra);
        }
        if (options.postDeserialize) {
          return options.postDeserialize.call(result, result);
        } else {
          return result;
        }
      })
    };
  }

  // node_modules/@yume-chan/struct/esm/extend.js
  // @__NO_SIDE_EFFECTS__
  function extend(base, fields, options) {
    return struct(Object.assign({}, base.fields, fields), {
      littleEndian: options?.littleEndian ?? base.littleEndian,
      extra: base.extra,
      postDeserialize: options?.postDeserialize
    });
  }

  // node_modules/@yume-chan/no-data-view/esm/int32.js
  // @__NO_SIDE_EFFECTS__
  function getInt32(buffer2, offset, littleEndian) {
    return littleEndian ? buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24 : buffer2[offset] << 24 | buffer2[offset + 1] << 16 | buffer2[offset + 2] << 8 | buffer2[offset + 3];
  }
  function setInt32(buffer2, offset, value, littleEndian) {
    if (littleEndian) {
      buffer2[offset] = value;
      buffer2[offset + 1] = value >> 8;
      buffer2[offset + 2] = value >> 16;
      buffer2[offset + 3] = value >> 24;
    } else {
      buffer2[offset] = value >> 24;
      buffer2[offset + 1] = value >> 16;
      buffer2[offset + 2] = value >> 8;
      buffer2[offset + 3] = value;
    }
  }

  // node_modules/@yume-chan/no-data-view/esm/int64.js
  function setInt64LittleEndian(buffer2, offset, value) {
    buffer2[offset] = Number(value & 0xffn);
    buffer2[offset + 1] = Number(value >> 8n & 0xffn);
    buffer2[offset + 2] = Number(value >> 16n & 0xffn);
    buffer2[offset + 3] = Number(value >> 24n & 0xffn);
    buffer2[offset + 4] = Number(value >> 32n & 0xffn);
    buffer2[offset + 5] = Number(value >> 40n & 0xffn);
    buffer2[offset + 6] = Number(value >> 48n & 0xffn);
    buffer2[offset + 7] = Number(value >> 56n & 0xffn);
  }
  function setInt64BigEndian(buffer2, offset, value) {
    buffer2[offset] = Number(value >> 56n & 0xffn);
    buffer2[offset + 1] = Number(value >> 48n & 0xffn);
    buffer2[offset + 2] = Number(value >> 40n & 0xffn);
    buffer2[offset + 3] = Number(value >> 32n & 0xffn);
    buffer2[offset + 4] = Number(value >> 24n & 0xffn);
    buffer2[offset + 5] = Number(value >> 16n & 0xffn);
    buffer2[offset + 6] = Number(value >> 8n & 0xffn);
    buffer2[offset + 7] = Number(value & 0xffn);
  }

  // node_modules/@yume-chan/no-data-view/esm/uint32.js
  // @__NO_SIDE_EFFECTS__
  function getUint32LittleEndian(buffer2, offset) {
    return (buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24) >>> 0;
  }
  // @__NO_SIDE_EFFECTS__
  function getUint32(buffer2, offset, littleEndian) {
    return littleEndian ? (buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24) >>> 0 : (buffer2[offset] << 24 | buffer2[offset + 1] << 16 | buffer2[offset + 2] << 8 | buffer2[offset + 3]) >>> 0;
  }
  function setUint32LittleEndian(buffer2, offset, value) {
    buffer2[offset] = value;
    buffer2[offset + 1] = value >> 8;
    buffer2[offset + 2] = value >> 16;
    buffer2[offset + 3] = value >> 24;
  }
  function setUint32(buffer2, offset, value, littleEndian) {
    if (littleEndian) {
      buffer2[offset] = value;
      buffer2[offset + 1] = value >> 8;
      buffer2[offset + 2] = value >> 16;
      buffer2[offset + 3] = value >> 24;
    } else {
      buffer2[offset] = value >> 24;
      buffer2[offset + 1] = value >> 16;
      buffer2[offset + 2] = value >> 8;
      buffer2[offset + 3] = value;
    }
  }

  // node_modules/@yume-chan/no-data-view/esm/uint64.js
  function getUint64BigEndian(buffer2, offset) {
    return BigInt(buffer2[offset]) << 56n | BigInt(buffer2[offset + 1]) << 48n | BigInt(buffer2[offset + 2]) << 40n | BigInt(buffer2[offset + 3]) << 32n | BigInt(buffer2[offset + 4]) << 24n | BigInt(buffer2[offset + 5]) << 16n | BigInt(buffer2[offset + 6]) << 8n | BigInt(buffer2[offset + 7]);
  }
  function getUint64(buffer2, offset, littleEndian) {
    return littleEndian ? BigInt(buffer2[offset]) | BigInt(buffer2[offset + 1]) << 8n | BigInt(buffer2[offset + 2]) << 16n | BigInt(buffer2[offset + 3]) << 24n | BigInt(buffer2[offset + 4]) << 32n | BigInt(buffer2[offset + 5]) << 40n | BigInt(buffer2[offset + 6]) << 48n | BigInt(buffer2[offset + 7]) << 56n : BigInt(buffer2[offset]) << 56n | BigInt(buffer2[offset + 1]) << 48n | BigInt(buffer2[offset + 2]) << 40n | BigInt(buffer2[offset + 3]) << 32n | BigInt(buffer2[offset + 4]) << 24n | BigInt(buffer2[offset + 5]) << 16n | BigInt(buffer2[offset + 6]) << 8n | BigInt(buffer2[offset + 7]);
  }
  function setUint64(buffer2, offset, value, littleEndian) {
    if (littleEndian) {
      buffer2[offset] = Number(value & 0xffn);
      buffer2[offset + 1] = Number(value >> 8n & 0xffn);
      buffer2[offset + 2] = Number(value >> 16n & 0xffn);
      buffer2[offset + 3] = Number(value >> 24n & 0xffn);
      buffer2[offset + 4] = Number(value >> 32n & 0xffn);
      buffer2[offset + 5] = Number(value >> 40n & 0xffn);
      buffer2[offset + 6] = Number(value >> 48n & 0xffn);
      buffer2[offset + 7] = Number(value >> 56n & 0xffn);
    } else {
      buffer2[offset] = Number(value >> 56n & 0xffn);
      buffer2[offset + 1] = Number(value >> 48n & 0xffn);
      buffer2[offset + 2] = Number(value >> 40n & 0xffn);
      buffer2[offset + 3] = Number(value >> 32n & 0xffn);
      buffer2[offset + 4] = Number(value >> 24n & 0xffn);
      buffer2[offset + 5] = Number(value >> 16n & 0xffn);
      buffer2[offset + 6] = Number(value >> 8n & 0xffn);
      buffer2[offset + 7] = Number(value & 0xffn);
    }
  }

  // node_modules/@yume-chan/struct/esm/number.js
  // @__NO_SIDE_EFFECTS__
  function number(size, serialize, deserialize) {
    const fn = (() => fn);
    Object.assign(fn, field(size, "byob", serialize, deserialize));
    return fn;
  }
  var u8 = /* @__PURE__ */ number(1, (value, { buffer: buffer2, index }) => {
    buffer2[index] = value;
  }, function* (then, reader) {
    const data = yield* then(reader.readExactly(1));
    return data[0];
  });
  var u32 = /* @__PURE__ */ number(4, (value, { buffer: buffer2, index, littleEndian }) => {
    setUint32(buffer2, index, value, littleEndian);
  }, function* (then, reader, { littleEndian }) {
    const data = yield* then(reader.readExactly(4));
    return getUint32(data, 0, littleEndian);
  });
  var s32 = /* @__PURE__ */ number(4, (value, { buffer: buffer2, index, littleEndian }) => {
    setInt32(buffer2, index, value, littleEndian);
  }, function* (then, reader, { littleEndian }) {
    const data = yield* then(reader.readExactly(4));
    return getInt32(data, 0, littleEndian);
  });
  var u64 = /* @__PURE__ */ number(8, (value, { buffer: buffer2, index, littleEndian }) => {
    setUint64(buffer2, index, value, littleEndian);
  }, function* (then, reader, { littleEndian }) {
    const data = yield* then(reader.readExactly(8));
    return getUint64(data, 0, littleEndian);
  });

  // node_modules/@yume-chan/struct/esm/utils.js
  var { TextEncoder, TextDecoder } = globalThis;
  var SharedEncoder = /* @__PURE__ */ new TextEncoder();
  var SharedDecoder = /* @__PURE__ */ new TextDecoder();
  // @__NO_SIDE_EFFECTS__
  function encodeUtf8(input) {
    return SharedEncoder.encode(input);
  }
  // @__NO_SIDE_EFFECTS__
  function decodeUtf8(buffer2) {
    return SharedDecoder.decode(buffer2);
  }

  // node_modules/@yume-chan/struct/esm/string.js
  var string = (/* @__NO_SIDE_EFFECTS__ */ (lengthOrField) => {
    const field2 = buffer(lengthOrField, {
      convert: decodeUtf8,
      back: encodeUtf8
    });
    field2.as = () => field2;
    return field2;
  });

  // node_modules/@yume-chan/stream-extra/esm/stream.js
  var { AbortController } = globalThis;
  var ReadableStream = /* @__PURE__ */ (() => {
    const { ReadableStream: ReadableStream2 } = globalThis;
    if (!ReadableStream2.from) {
      ReadableStream2.from = function(iterable) {
        const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
        return new ReadableStream2({
          async pull(controller) {
            const result = await iterator.next();
            if (result.done) {
              controller.close();
              return;
            }
            controller.enqueue(result.value);
          },
          async cancel(reason) {
            await iterator.return?.(reason);
          }
        });
      };
    }
    if (!ReadableStream2.prototype[Symbol.asyncIterator] || !ReadableStream2.prototype.values) {
      ReadableStream2.prototype.values = async function* (options) {
        const reader = this.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              return;
            }
            yield value;
          }
        } finally {
          if (!options?.preventCancel) {
            await reader.cancel();
          }
          reader.releaseLock();
        }
      };
      ReadableStream2.prototype[Symbol.asyncIterator] = // eslint-disable-next-line @typescript-eslint/unbound-method
      ReadableStream2.prototype.values;
    }
    return ReadableStream2;
  })();
  var { WritableStream, TransformStream } = globalThis;

  // node_modules/@yume-chan/stream-extra/esm/task-queue.js
  var _ready, _disposed;
  var TaskQueue = class {
    constructor() {
      __privateAdd(this, _ready);
      __privateAdd(this, _disposed, false);
    }
    enqueue(task, bail = false) {
      if (__privateGet(this, _disposed)) {
        throw new Error("TaskQueue is disposed");
      }
      if (!__privateGet(this, _ready)) {
        try {
          const result2 = task();
          if (isPromiseLike(result2)) {
            __privateSet(this, _ready, result2.then(() => {
            }, (e) => {
              if (bail) {
                throw e;
              }
            }));
          }
          return result2;
        } catch (e) {
          if (bail) {
            const promise = Promise.reject(e);
            void promise.catch(() => {
            });
            __privateSet(this, _ready, promise);
          }
          throw e;
        }
      }
      const result = __privateGet(this, _ready).then(() => {
        if (__privateGet(this, _disposed)) {
          throw new Error("TaskQueue is disposed");
        }
        return task();
      });
      __privateSet(this, _ready, result.then(() => {
      }, (e) => {
        if (bail || __privateGet(this, _disposed)) {
          throw e;
        }
      }));
      return result;
    }
    dispose() {
      __privateSet(this, _disposed, true);
    }
  };
  _ready = new WeakMap();
  _disposed = new WeakMap();

  // node_modules/@yume-chan/stream-extra/esm/push-readable.js
  var PushReadableStream = class extends ReadableStream {
    /**
     * Create a new `PushReadableStream` from a source.
     *
     * @param source If `source` returns a `Promise`, the stream will be closed
     * when the `Promise` is resolved, and be errored when the `Promise` is rejected.
     * @param strategy
     */
    constructor(source, strategy, logger) {
      let controller;
      const tasks = new TaskQueue();
      let zeroHighWaterMarkAllowEnqueue = false;
      let waterMarkLow;
      const abortController = new AbortController();
      let stopped = false;
      const enqueue = (chunk) => {
        logger?.({
          source: "producer",
          operation: "enqueue",
          value: chunk,
          phase: "start"
        });
        if (abortController.signal.aborted) {
          logger?.({
            source: "producer",
            operation: "enqueue",
            value: chunk,
            phase: "ignored"
          });
          return false;
        }
        if (controller.desiredSize === null) {
          controller.enqueue(chunk);
          throw new Error("unreachable");
        }
        if (zeroHighWaterMarkAllowEnqueue) {
          zeroHighWaterMarkAllowEnqueue = false;
          controller.enqueue(chunk);
          logger?.({
            source: "producer",
            operation: "enqueue",
            value: chunk,
            phase: "complete"
          });
          return true;
        }
        if (controller.desiredSize <= 0) {
          logger?.({
            source: "producer",
            operation: "enqueue",
            value: chunk,
            phase: "waiting"
          });
          waterMarkLow = new PromiseResolver();
          return waterMarkLow.promise.then(() => {
            controller.enqueue(chunk);
            logger?.({
              source: "producer",
              operation: "enqueue",
              value: chunk,
              phase: "complete"
            });
            return true;
          }, () => {
            logger?.({
              source: "producer",
              operation: "enqueue",
              value: chunk,
              phase: "ignored"
            });
            return false;
          });
        }
        controller.enqueue(chunk);
        logger?.({
          source: "producer",
          operation: "enqueue",
          value: chunk,
          phase: "complete"
        });
        return true;
      };
      const close = (explicit) => {
        logger?.({
          source: "producer",
          operation: "close",
          explicit,
          phase: "start"
        });
        if (abortController.signal.aborted || stopped && !explicit) {
          logger?.({
            source: "producer",
            operation: "close",
            explicit,
            phase: "ignored"
          });
          return;
        }
        controller.close();
        stopped = true;
        waterMarkLow?.reject();
        logger?.({
          source: "producer",
          operation: "close",
          explicit,
          phase: "complete"
        });
      };
      const error = (error2, explicit) => {
        logger?.({
          source: "producer",
          operation: "error",
          explicit,
          phase: "start"
        });
        stopped = true;
        controller.error(error2);
        waterMarkLow?.reject();
        logger?.({
          source: "producer",
          operation: "error",
          explicit,
          phase: "complete"
        });
      };
      super({
        start: (controller_) => {
          controller = controller_;
          const result = source({
            abortSignal: abortController.signal,
            enqueue: async (chunk) => (
              // Run `enqueue`s in serial
              // Use `async/await` to always return a `Promise`
              await tasks.enqueue(() => enqueue(chunk))
            ),
            close() {
              close(true);
            },
            error(e) {
              error(e, true);
            }
          });
          if (!stopped && isPromiseLike(result)) {
            result.then(() => close(false), (e) => error(e, false));
          }
        },
        pull: () => {
          logger?.({
            source: "consumer",
            operation: "pull",
            phase: "start"
          });
          if (waterMarkLow) {
            waterMarkLow.resolve(void 0);
            waterMarkLow = void 0;
          } else if (strategy?.highWaterMark === 0) {
            zeroHighWaterMarkAllowEnqueue = true;
          }
          logger?.({
            source: "consumer",
            operation: "pull",
            phase: "complete"
          });
        },
        cancel: (reason) => {
          logger?.({
            source: "consumer",
            operation: "cancel",
            phase: "start"
          });
          stopped = true;
          abortController.abort(reason);
          waterMarkLow?.reject();
          logger?.({
            source: "consumer",
            operation: "cancel",
            phase: "complete"
          });
        }
      }, strategy);
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/try-close.js
  function tryClose(value) {
    try {
      const result = value.close();
      if (isPromiseLike(result)) {
        return result.then(() => true, () => false);
      }
      return true;
    } catch {
      return false;
    }
  }
  async function tryCancel(stream) {
    try {
      await stream.cancel();
      return true;
    } catch {
      return false;
    }
  }

  // node_modules/@yume-chan/stream-extra/esm/buffered.js
  var _buffered, _bufferedOffset, _bufferedLength, _position2, _BufferedReadableStream_instances, readBuffered_fn, readSource_fn;
  var BufferedReadableStream = class {
    constructor(stream) {
      __privateAdd(this, _BufferedReadableStream_instances);
      __privateAdd(this, _buffered);
      // PERF: `subarray` is slow
      // don't use it until absolutely necessary
      __privateAdd(this, _bufferedOffset, 0);
      __privateAdd(this, _bufferedLength, 0);
      __privateAdd(this, _position2, 0);
      __publicField(this, "stream");
      __publicField(this, "reader");
      __publicField(this, "readExactly", bipedal(function* (then, length) {
        let result;
        let index = 0;
        const initial = __privateMethod(this, _BufferedReadableStream_instances, readBuffered_fn).call(this, length);
        if (initial) {
          if (initial.length === length) {
            return initial;
          }
          result = new Uint8Array(length);
          result.set(initial, index);
          index += initial.length;
          length -= initial.length;
        } else {
          result = new Uint8Array(length);
        }
        while (length > 0) {
          const value = yield* then(__privateMethod(this, _BufferedReadableStream_instances, readSource_fn).call(this, length));
          result.set(value, index);
          index += value.length;
          length -= value.length;
        }
        return result;
      }));
      this.stream = stream;
      this.reader = stream.getReader();
    }
    get position() {
      return __privateGet(this, _position2);
    }
    iterateExactly(length) {
      let state = __privateGet(this, _buffered) ? 0 : 1;
      return {
        next: () => {
          switch (state) {
            case 0: {
              const value = __privateMethod(this, _BufferedReadableStream_instances, readBuffered_fn).call(this, length);
              if (value.length === length) {
                state = 2;
              } else {
                length -= value.length;
                state = 1;
              }
              return { done: false, value };
            }
            case 1:
              state = 3;
              return {
                done: false,
                value: __privateMethod(this, _BufferedReadableStream_instances, readSource_fn).call(this, length).then((value) => {
                  if (value.length === length) {
                    state = 2;
                  } else {
                    length -= value.length;
                    state = 1;
                  }
                  return value;
                })
              };
            case 2:
              return { done: true, value: void 0 };
            case 3:
              throw new Error("Can't call `next` before previous Promise resolves");
            default:
              throw new Error("unreachable");
          }
        }
      };
    }
    /**
     * Return a readable stream with unconsumed data (if any) and
     * all data from the wrapped stream.
     * @returns A `ReadableStream`
     */
    release() {
      if (__privateGet(this, _bufferedLength) > 0) {
        return new PushReadableStream(async (controller) => {
          const buffered = __privateGet(this, _buffered).subarray(__privateGet(this, _bufferedOffset));
          await controller.enqueue(buffered);
          controller.abortSignal.addEventListener("abort", () => {
            void tryCancel(this.reader);
          });
          while (true) {
            const { done, value } = await this.reader.read();
            if (done) {
              return;
            }
            await controller.enqueue(value);
          }
        });
      } else {
        this.reader.releaseLock();
        return this.stream;
      }
    }
    async cancel(reason) {
      await this.reader.cancel(reason);
    }
  };
  _buffered = new WeakMap();
  _bufferedOffset = new WeakMap();
  _bufferedLength = new WeakMap();
  _position2 = new WeakMap();
  _BufferedReadableStream_instances = new WeakSet();
  readBuffered_fn = function(length) {
    if (!__privateGet(this, _buffered)) {
      return void 0;
    }
    const value = __privateGet(this, _buffered).subarray(__privateGet(this, _bufferedOffset), __privateGet(this, _bufferedOffset) + length);
    if (__privateGet(this, _bufferedLength) > length) {
      __privateSet(this, _position2, __privateGet(this, _position2) + length);
      __privateSet(this, _bufferedOffset, __privateGet(this, _bufferedOffset) + length);
      __privateSet(this, _bufferedLength, __privateGet(this, _bufferedLength) - length);
      return value;
    }
    __privateSet(this, _position2, __privateGet(this, _position2) + __privateGet(this, _bufferedLength));
    __privateSet(this, _buffered, void 0);
    __privateSet(this, _bufferedOffset, 0);
    __privateSet(this, _bufferedLength, 0);
    return value;
  };
  readSource_fn = async function(length) {
    const { done, value } = await this.reader.read();
    if (done) {
      throw new ExactReadableEndedError();
    }
    if (value.length > length) {
      __privateSet(this, _buffered, value);
      __privateSet(this, _bufferedOffset, length);
      __privateSet(this, _bufferedLength, value.length - length);
      __privateSet(this, _position2, __privateGet(this, _position2) + length);
      return value.subarray(0, length);
    }
    __privateSet(this, _position2, __privateGet(this, _position2) + value.length);
    return value;
  };

  // node_modules/@yume-chan/stream-extra/esm/buffered-transform.js
  var _readable, _writable;
  var BufferedTransformStream = class {
    constructor(transform) {
      __privateAdd(this, _readable);
      __privateAdd(this, _writable);
      let bufferedStreamController;
      let writableStreamController;
      const buffered = new BufferedReadableStream(new PushReadableStream((controller) => {
        bufferedStreamController = controller;
      }));
      __privateSet(this, _readable, new ReadableStream({
        async pull(controller) {
          try {
            const value = await transform(buffered);
            controller.enqueue(value);
          } catch (e) {
            if (e instanceof StructEmptyError) {
              controller.close();
              return;
            }
            throw e;
          }
        },
        cancel: (reason) => {
          return writableStreamController.error(reason);
        }
      }));
      __privateSet(this, _writable, new WritableStream({
        start(controller) {
          writableStreamController = controller;
        },
        async write(chunk) {
          await bufferedStreamController.enqueue(chunk);
        },
        abort() {
          bufferedStreamController.close();
        },
        close() {
          bufferedStreamController.close();
        }
      }));
    }
    get readable() {
      return __privateGet(this, _readable);
    }
    get writable() {
      return __privateGet(this, _writable);
    }
  };
  _readable = new WeakMap();
  _writable = new WeakMap();

  // node_modules/@yume-chan/stream-extra/esm/concat.js
  var _result, _resolver, _writable2, _readableController, _readable2;
  var ConcatStringStream = class {
    constructor() {
      // PERF: rope (concat strings) is faster than `[].join('')`
      __privateAdd(this, _result, "");
      __privateAdd(this, _resolver, new PromiseResolver());
      __privateAdd(this, _writable2, new WritableStream({
        write: (chunk) => {
          __privateSet(this, _result, __privateGet(this, _result) + chunk);
        },
        close: () => {
          __privateGet(this, _resolver).resolve(__privateGet(this, _result));
          __privateGet(this, _readableController).enqueue(__privateGet(this, _result));
          __privateGet(this, _readableController).close();
        },
        abort: (reason) => {
          __privateGet(this, _resolver).reject(reason);
          __privateGet(this, _readableController).error(reason);
        }
      }));
      __privateAdd(this, _readableController);
      __privateAdd(this, _readable2, new ReadableStream({
        start: (controller) => {
          __privateSet(this, _readableController, controller);
        }
      }));
      void Object.defineProperties(__privateGet(this, _readable2), {
        then: {
          get: () => __privateGet(this, _resolver).promise.then.bind(__privateGet(this, _resolver).promise)
        },
        catch: {
          get: () => __privateGet(this, _resolver).promise.catch.bind(__privateGet(this, _resolver).promise)
        },
        finally: {
          get: () => __privateGet(this, _resolver).promise.finally.bind(__privateGet(this, _resolver).promise)
        }
      });
    }
    get writable() {
      return __privateGet(this, _writable2);
    }
    get readable() {
      return __privateGet(this, _readable2);
    }
  };
  _result = new WeakMap();
  _resolver = new WeakMap();
  _writable2 = new WeakMap();
  _readableController = new WeakMap();
  _readable2 = new WeakMap();
  var _segments, _resolver2, _writable3, _readableController2, _readable3;
  var ConcatBufferStream = class {
    constructor() {
      __privateAdd(this, _segments, []);
      __privateAdd(this, _resolver2, new PromiseResolver());
      __privateAdd(this, _writable3, new WritableStream({
        write: (chunk) => {
          __privateGet(this, _segments).push(chunk);
        },
        close: () => {
          let result;
          let offset = 0;
          switch (__privateGet(this, _segments).length) {
            case 0:
              result = EmptyUint8Array;
              break;
            case 1:
              result = __privateGet(this, _segments)[0];
              break;
            default:
              result = new Uint8Array(__privateGet(this, _segments).reduce((prev, item) => prev + item.length, 0));
              for (const segment of __privateGet(this, _segments)) {
                result.set(segment, offset);
                offset += segment.length;
              }
              break;
          }
          __privateGet(this, _resolver2).resolve(result);
          __privateGet(this, _readableController2).enqueue(result);
          __privateGet(this, _readableController2).close();
        },
        abort: (reason) => {
          __privateGet(this, _resolver2).reject(reason);
          __privateGet(this, _readableController2).error(reason);
        }
      }));
      __privateAdd(this, _readableController2);
      __privateAdd(this, _readable3, new ReadableStream({
        start: (controller) => {
          __privateSet(this, _readableController2, controller);
        }
      }));
      void Object.defineProperties(__privateGet(this, _readable3), {
        then: {
          get: () => __privateGet(this, _resolver2).promise.then.bind(__privateGet(this, _resolver2).promise)
        },
        catch: {
          get: () => __privateGet(this, _resolver2).promise.catch.bind(__privateGet(this, _resolver2).promise)
        },
        finally: {
          get: () => __privateGet(this, _resolver2).promise.finally.bind(__privateGet(this, _resolver2).promise)
        }
      });
    }
    get writable() {
      return __privateGet(this, _writable3);
    }
    get readable() {
      return __privateGet(this, _readable3);
    }
  };
  _segments = new WeakMap();
  _resolver2 = new WeakMap();
  _writable3 = new WeakMap();
  _readableController2 = new WeakMap();
  _readable3 = new WeakMap();

  // node_modules/@yume-chan/stream-extra/esm/consumable/readable.js
  var ConsumableReadableStream = class _ConsumableReadableStream extends ReadableStream {
    static async enqueue(controller, chunk) {
      const output = new Consumable(chunk);
      controller.enqueue(output);
      await output.consumed;
    }
    constructor(source, strategy) {
      let wrappedController;
      let wrappedStrategy;
      if (strategy) {
        wrappedStrategy = {};
        if ("highWaterMark" in strategy) {
          wrappedStrategy.highWaterMark = strategy.highWaterMark;
        }
        if ("size" in strategy) {
          wrappedStrategy.size = (chunk) => {
            return strategy.size(chunk.value);
          };
        }
      }
      super({
        start(controller) {
          wrappedController = {
            enqueue(chunk) {
              return _ConsumableReadableStream.enqueue(controller, chunk);
            },
            close() {
              controller.close();
            },
            error(reason) {
              controller.error(reason);
            }
          };
          return source.start?.(wrappedController);
        },
        pull() {
          return source.pull?.(wrappedController);
        },
        cancel(reason) {
          return source.cancel?.(reason);
        }
      }, wrappedStrategy);
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/consumable/wrap-byte-readable.js
  var ConsumableWrapByteReadableStream = class extends ReadableStream {
    constructor(stream, chunkSize, min) {
      const reader = stream.getReader({ mode: "byob" });
      let array = new Uint8Array(chunkSize);
      super({
        async pull(controller) {
          const { done, value } = await reader.read(array, { min });
          if (done) {
            controller.close();
            return;
          }
          await ConsumableReadableStream.enqueue(controller, value);
          array = new Uint8Array(value.buffer);
        },
        cancel(reason) {
          return reader.cancel(reason);
        }
      });
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/consumable/wrap-writable.js
  var ConsumableWrapWritableStream = class extends WritableStream {
    constructor(stream) {
      const writer = stream.getWriter();
      super({
        write(chunk) {
          return chunk.tryConsume((chunk2) => writer.write(chunk2));
        },
        abort(reason) {
          return writer.abort(reason);
        },
        close() {
          return writer.close();
        }
      });
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/consumable/writable.js
  var ConsumableWritableStream = class extends WritableStream {
    static async write(writer, value) {
      const consumable = new Consumable(value);
      await writer.write(consumable);
      await consumable.consumed;
    }
    constructor(sink, strategy) {
      let wrappedStrategy;
      if (strategy) {
        wrappedStrategy = {};
        if ("highWaterMark" in strategy) {
          wrappedStrategy.highWaterMark = strategy.highWaterMark;
        }
        if ("size" in strategy) {
          wrappedStrategy.size = (chunk) => {
            return strategy.size(chunk instanceof Consumable ? chunk.value : chunk);
          };
        }
      }
      super({
        start(controller) {
          return sink.start?.(controller);
        },
        write(chunk, controller) {
          return chunk.tryConsume((chunk2) => sink.write?.(chunk2, controller));
        },
        abort(reason) {
          return sink.abort?.(reason);
        },
        close() {
          return sink.close?.();
        }
      }, wrappedStrategy);
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/task.js
  var { console } = globalThis;
  var createTask = /* @__PURE__ */ (() => console?.createTask?.bind(console) ?? (() => ({
    run(callback) {
      return callback();
    }
  })))();

  // node_modules/@yume-chan/stream-extra/esm/consumable.js
  var _task, _resolver3;
  var Consumable = class {
    constructor(value) {
      __privateAdd(this, _task);
      __privateAdd(this, _resolver3);
      __publicField(this, "value");
      __publicField(this, "consumed");
      __privateSet(this, _task, createTask("Consumable"));
      this.value = value;
      __privateSet(this, _resolver3, new PromiseResolver());
      this.consumed = __privateGet(this, _resolver3).promise;
    }
    consume() {
      __privateGet(this, _resolver3).resolve();
    }
    error(error) {
      __privateGet(this, _resolver3).reject(error);
    }
    tryConsume(callback) {
      try {
        let result = __privateGet(this, _task).run(() => callback(this.value));
        if (isPromiseLike(result)) {
          result = result.then((value) => {
            __privateGet(this, _resolver3).resolve();
            return value;
          }, (e) => {
            __privateGet(this, _resolver3).reject(e);
            throw e;
          });
        } else {
          __privateGet(this, _resolver3).resolve();
        }
        return result;
      } catch (e) {
        __privateGet(this, _resolver3).reject(e);
        throw e;
      }
    }
  };
  _task = new WeakMap();
  _resolver3 = new WeakMap();
  __publicField(Consumable, "WritableStream", ConsumableWritableStream);
  __publicField(Consumable, "WrapWritableStream", ConsumableWrapWritableStream);
  __publicField(Consumable, "ReadableStream", ConsumableReadableStream);
  __publicField(Consumable, "WrapByteReadableStream", ConsumableWrapByteReadableStream);

  // node_modules/@yume-chan/stream-extra/esm/maybe-consumable/index.js
  var maybe_consumable_exports = {};
  __export(maybe_consumable_exports, {
    WrapWritableStream: () => MaybeConsumableWrapWritableStream,
    WritableStream: () => MaybeConsumableWritableStream,
    getValue: () => getValue,
    tryConsume: () => tryConsume
  });

  // node_modules/@yume-chan/stream-extra/esm/maybe-consumable/utils.js
  function getValue(value) {
    return value instanceof Consumable ? value.value : value;
  }
  function tryConsume(value, callback) {
    if (value instanceof Consumable) {
      return value.tryConsume(callback);
    } else {
      return callback(value);
    }
  }

  // node_modules/@yume-chan/stream-extra/esm/maybe-consumable/wrap-writable.js
  var MaybeConsumableWrapWritableStream = class extends WritableStream {
    constructor(stream) {
      const writer = stream.getWriter();
      super({
        write(chunk) {
          return tryConsume(chunk, (chunk2) => writer.write(chunk2));
        },
        abort(reason) {
          return writer.abort(reason);
        },
        close() {
          return writer.close();
        }
      });
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/maybe-consumable/writable.js
  var MaybeConsumableWritableStream = class extends WritableStream {
    constructor(sink, strategy) {
      let wrappedStrategy;
      if (strategy) {
        wrappedStrategy = {};
        if ("highWaterMark" in strategy) {
          wrappedStrategy.highWaterMark = strategy.highWaterMark;
        }
        if ("size" in strategy) {
          wrappedStrategy.size = (chunk) => {
            return strategy.size(chunk instanceof Consumable ? chunk.value : chunk);
          };
        }
      }
      super({
        start(controller) {
          return sink.start?.(controller);
        },
        write(chunk, controller) {
          return tryConsume(chunk, (chunk2) => sink.write?.(chunk2, controller));
        },
        abort(reason) {
          return sink.abort?.(reason);
        },
        close() {
          return sink.close?.();
        }
      }, wrappedStrategy);
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/distribution.js
  var _capacity, _buffer, _offset, _available;
  var BufferCombiner = class {
    constructor(size) {
      __privateAdd(this, _capacity);
      __privateAdd(this, _buffer);
      __privateAdd(this, _offset);
      __privateAdd(this, _available);
      __privateSet(this, _capacity, size);
      __privateSet(this, _buffer, new Uint8Array(size));
      __privateSet(this, _offset, 0);
      __privateSet(this, _available, size);
    }
    /**
     * Pushes data to the combiner.
     * @param data The input data to be split or combined.
     * @returns
     * A generator that yields buffers of specified size.
     * It may yield the same buffer multiple times, consume the data before calling `next`.
     */
    *push(data) {
      let offset = 0;
      let available = data.length;
      if (__privateGet(this, _offset) !== 0) {
        if (available >= __privateGet(this, _available)) {
          __privateGet(this, _buffer).set(data.subarray(0, __privateGet(this, _available)), __privateGet(this, _offset));
          offset += __privateGet(this, _available);
          available -= __privateGet(this, _available);
          yield __privateGet(this, _buffer);
          __privateSet(this, _offset, 0);
          __privateSet(this, _available, __privateGet(this, _capacity));
          if (available === 0) {
            return;
          }
        } else {
          __privateGet(this, _buffer).set(data, __privateGet(this, _offset));
          __privateSet(this, _offset, __privateGet(this, _offset) + available);
          __privateSet(this, _available, __privateGet(this, _available) - available);
          return;
        }
      }
      while (available >= __privateGet(this, _capacity)) {
        const end = offset + __privateGet(this, _capacity);
        yield data.subarray(offset, end);
        offset = end;
        available -= __privateGet(this, _capacity);
      }
      if (available > 0) {
        __privateGet(this, _buffer).set(data.subarray(offset), __privateGet(this, _offset));
        __privateSet(this, _offset, __privateGet(this, _offset) + available);
        __privateSet(this, _available, __privateGet(this, _available) - available);
      }
    }
    flush() {
      if (__privateGet(this, _offset) === 0) {
        return void 0;
      }
      const output = __privateGet(this, _buffer).subarray(0, __privateGet(this, _offset));
      __privateSet(this, _offset, 0);
      __privateSet(this, _available, __privateGet(this, _capacity));
      return output;
    }
  };
  _capacity = new WeakMap();
  _buffer = new WeakMap();
  _offset = new WeakMap();
  _available = new WeakMap();
  var DistributionStream = class extends TransformStream {
    constructor(size, combine = false) {
      const combiner = combine ? new BufferCombiner(size) : void 0;
      super({
        async transform(chunk, controller) {
          await maybe_consumable_exports.tryConsume(chunk, async (chunk2) => {
            if (combiner) {
              for (const buffer2 of combiner.push(chunk2)) {
                await Consumable.ReadableStream.enqueue(controller, buffer2);
              }
            } else {
              let offset = 0;
              let available = chunk2.length;
              while (available > 0) {
                const end = offset + size;
                await Consumable.ReadableStream.enqueue(controller, chunk2.subarray(offset, end));
                offset = end;
                available -= size;
              }
            }
          });
        },
        flush(controller) {
          if (combiner) {
            const data = combiner.flush();
            if (data) {
              controller.enqueue(data);
            }
          }
        }
      });
    }
  };

  // node_modules/@yume-chan/stream-extra/esm/wrap-readable.js
  function getWrappedReadableStream(wrapper, controller) {
    if ("start" in wrapper) {
      return wrapper.start(controller);
    } else if (typeof wrapper === "function") {
      return wrapper(controller);
    } else {
      return wrapper;
    }
  }
  var _reader;
  var WrapReadableStream = class extends ReadableStream {
    constructor(wrapper, strategy) {
      super({
        start: async (controller) => {
          const readable = await getWrappedReadableStream(wrapper, controller);
          this.readable = readable;
          __privateSet(this, _reader, this.readable.getReader());
        },
        pull: async (controller) => {
          const { done, value } = await __privateGet(this, _reader).read().catch((e) => {
            if ("error" in wrapper) {
              wrapper.error(e);
            }
            throw e;
          });
          if (done) {
            controller.close();
            if ("close" in wrapper) {
              await wrapper.close?.();
            }
          } else {
            controller.enqueue(value);
          }
        },
        cancel: async (reason) => {
          await __privateGet(this, _reader).cancel(reason);
          if ("cancel" in wrapper) {
            await wrapper.cancel?.(reason);
          }
        }
      }, strategy);
      __publicField(this, "readable");
      __privateAdd(this, _reader);
    }
  };
  _reader = new WeakMap();

  // node_modules/@yume-chan/stream-extra/esm/duplex.js
  var NOOP = () => {
  };
  var _readableControllers, _writers, _writableClosed, _closed, _options;
  var DuplexStreamFactory = class {
    constructor(options) {
      __privateAdd(this, _readableControllers, []);
      __privateAdd(this, _writers, []);
      __privateAdd(this, _writableClosed, false);
      __privateAdd(this, _closed, new PromiseResolver());
      __privateAdd(this, _options);
      __privateSet(this, _options, options ?? {});
    }
    get writableClosed() {
      return __privateGet(this, _writableClosed);
    }
    get closed() {
      return __privateGet(this, _closed).promise;
    }
    wrapReadable(readable, strategy) {
      return new WrapReadableStream({
        start: (controller) => {
          __privateGet(this, _readableControllers).push(controller);
          return readable;
        },
        cancel: async () => {
          await this.close();
        },
        close: async () => {
          await this.dispose();
        }
      }, strategy);
    }
    createWritable(stream) {
      const writer = stream.getWriter();
      __privateGet(this, _writers).push(writer);
      return new WritableStream({
        write: async (chunk) => {
          await writer.write(chunk);
        },
        abort: async (reason) => {
          await writer.abort(reason);
          await this.close();
        },
        close: async () => {
          await writer.close().catch(NOOP);
          await this.close();
        }
      });
    }
    async close() {
      if (__privateGet(this, _writableClosed)) {
        return;
      }
      __privateSet(this, _writableClosed, true);
      if (await __privateGet(this, _options).close?.() !== false) {
        await this.dispose();
      }
      for (const writer of __privateGet(this, _writers)) {
        writer.close().catch(NOOP);
      }
    }
    async dispose() {
      __privateSet(this, _writableClosed, true);
      __privateGet(this, _closed).resolve();
      for (const controller of __privateGet(this, _readableControllers)) {
        tryClose(controller);
      }
      await __privateGet(this, _options).dispose?.();
    }
  };
  _readableControllers = new WeakMap();
  _writers = new WeakMap();
  _writableClosed = new WeakMap();
  _closed = new WeakMap();
  _options = new WeakMap();

  // node_modules/@yume-chan/stream-extra/esm/encoding.js
  var Global = globalThis;
  var TextDecoderStream = Global.TextDecoderStream;
  var TextEncoderStream = Global.TextEncoderStream;

  // node_modules/@yume-chan/stream-extra/esm/pipe-from.js
  function pipeFrom(writable, pair) {
    const writer = pair.writable.getWriter();
    const pipe = pair.readable.pipeTo(writable);
    return new WritableStream({
      async write(chunk) {
        await writer.write(chunk);
      },
      async close() {
        await writer.close();
        await pipe;
      }
    });
  }

  // node_modules/@yume-chan/stream-extra/esm/struct-deserialize.js
  var StructDeserializeStream = class extends BufferedTransformStream {
    constructor(struct2) {
      super((stream) => {
        return struct2.deserialize(stream);
      });
    }
  };

  // node_modules/@yume-chan/event/esm/disposable.js
  var _disposables;
  var AutoDisposable = class {
    constructor() {
      __privateAdd(this, _disposables, []);
      this.dispose = this.dispose.bind(this);
    }
    addDisposable(disposable) {
      __privateGet(this, _disposables).push(disposable);
      return disposable;
    }
    dispose() {
      for (const disposable of __privateGet(this, _disposables)) {
        disposable.dispose();
      }
      __privateSet(this, _disposables, []);
    }
  };
  _disposables = new WeakMap();

  // node_modules/@yume-chan/event/esm/event-emitter.js
  var EventEmitter = class {
    constructor() {
      __publicField(this, "listeners", []);
      __publicField(this, "event", (listener, thisArg, ...args) => {
        const info = {
          listener,
          thisArg,
          args
        };
        return this.addEventListener(info);
      });
      this.event = this.event.bind(this);
    }
    addEventListener(info) {
      this.listeners.push(info);
      const remove = () => {
        const index = this.listeners.indexOf(info);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      };
      remove.dispose = remove;
      return remove;
    }
    fire(e) {
      for (const info of this.listeners.slice()) {
        info.listener.call(info.thisArg, e, ...info.args);
      }
    }
    dispose() {
      this.listeners.length = 0;
    }
  };

  // node_modules/@yume-chan/event/esm/sticky-event-emitter.js
  var Undefined = /* @__PURE__ */ Symbol("undefined");
  var _value;
  var StickyEventEmitter = class extends EventEmitter {
    constructor() {
      super(...arguments);
      __privateAdd(this, _value, Undefined);
    }
    addEventListener(info) {
      if (__privateGet(this, _value) !== Undefined) {
        info.listener.call(info.thisArg, __privateGet(this, _value), ...info.args);
      }
      return super.addEventListener(info);
    }
    fire(e) {
      __privateSet(this, _value, e);
      super.fire(e);
    }
  };
  _value = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/base.js
  var _adb;
  var AdbServiceBase = class extends AutoDisposable {
    constructor(adb2) {
      super();
      __privateAdd(this, _adb);
      __privateSet(this, _adb, adb2);
    }
    get adb() {
      return __privateGet(this, _adb);
    }
  };
  _adb = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/framebuffer.js
  var Version = struct({ version: u32 }, { littleEndian: true });
  var AdbFrameBufferV1 = struct({
    bpp: u32,
    size: u32,
    width: u32,
    height: u32,
    red_offset: u32,
    red_length: u32,
    blue_offset: u32,
    blue_length: u32,
    green_offset: u32,
    green_length: u32,
    alpha_offset: u32,
    alpha_length: u32,
    data: buffer("size")
  }, { littleEndian: true });
  var AdbFrameBufferV2 = struct({
    bpp: u32,
    colorSpace: u32,
    size: u32,
    width: u32,
    height: u32,
    red_offset: u32,
    red_length: u32,
    blue_offset: u32,
    blue_length: u32,
    green_offset: u32,
    green_length: u32,
    alpha_offset: u32,
    alpha_length: u32,
    data: buffer("size")
  }, { littleEndian: true });
  var AdbFrameBufferError = class extends Error {
    constructor(message, options) {
      super(message, options);
    }
  };
  var AdbFrameBufferUnsupportedVersionError = class extends AdbFrameBufferError {
    constructor(version) {
      super(`Unsupported FrameBuffer version ${version}`);
    }
  };
  var AdbFrameBufferForbiddenError = class extends AdbFrameBufferError {
    constructor() {
      super("FrameBuffer is disabled by current app");
    }
  };
  async function framebuffer(adb2) {
    const socket = await adb2.createSocket("framebuffer:");
    const stream = new BufferedReadableStream(socket.readable);
    let version;
    try {
      ({ version } = await Version.deserialize(stream));
    } catch (e) {
      if (e instanceof StructEmptyError) {
        throw new AdbFrameBufferForbiddenError();
      }
      throw e;
    }
    switch (version) {
      case 1:
        return await AdbFrameBufferV1.deserialize(stream);
      case 2:
        return await AdbFrameBufferV2.deserialize(stream);
      default:
        throw new AdbFrameBufferUnsupportedVersionError(version);
    }
  }

  // node_modules/@yume-chan/adb/esm/commands/power.js
  var AdbPower = class extends AdbServiceBase {
    reboot(mode = "") {
      return this.adb.createSocketAndWait(`reboot:${mode}`);
    }
    bootloader() {
      return this.reboot("bootloader");
    }
    fastboot() {
      return this.reboot("fastboot");
    }
    recovery() {
      return this.reboot("recovery");
    }
    sideload() {
      return this.reboot("sideload");
    }
    /**
     * Reboot to Qualcomm Emergency Download (EDL) Mode.
     *
     * Only works on some Qualcomm devices.
     */
    qualcommEdlMode() {
      return this.reboot("edl");
    }
    powerOff() {
      return this.adb.subprocess.noneProtocol.spawnWaitText(["reboot", "-p"]);
    }
    powerButton(longPress = false) {
      const args = ["input", "keyevent"];
      if (longPress) {
        args.push("--longpress");
      }
      args.push("POWER");
      return this.adb.subprocess.noneProtocol.spawnWaitText(args);
    }
    /**
     * Reboot to Samsung Odin download mode.
     *
     * Only works on Samsung devices.
     */
    samsungOdin() {
      return this.reboot("download");
    }
  };

  // node_modules/@yume-chan/adb/esm/utils/array-buffer.js
  function toLocalUint8Array(value) {
    if (value.buffer instanceof ArrayBuffer) {
      return value;
    }
    const copy = new Uint8Array(value.length);
    copy.set(value);
    return copy;
  }

  // node_modules/@yume-chan/adb/esm/utils/auto-reset-event.js
  var _set, _queue;
  var AutoResetEvent = class {
    constructor(initialSet = false) {
      __privateAdd(this, _set);
      __privateAdd(this, _queue, []);
      __privateSet(this, _set, initialSet);
    }
    wait() {
      if (!__privateGet(this, _set)) {
        __privateSet(this, _set, true);
        if (__privateGet(this, _queue).length === 0) {
          return Promise.resolve();
        }
      }
      const resolver = new PromiseResolver();
      __privateGet(this, _queue).push(resolver);
      return resolver.promise;
    }
    notifyOne() {
      if (__privateGet(this, _queue).length !== 0) {
        __privateGet(this, _queue).pop().resolve();
      } else {
        __privateSet(this, _set, false);
      }
    }
    dispose() {
      for (const item of __privateGet(this, _queue)) {
        item.reject(new Error("The AutoResetEvent has been disposed"));
      }
      __privateGet(this, _queue).length = 0;
    }
  };
  _set = new WeakMap();
  _queue = new WeakMap();

  // node_modules/@yume-chan/adb/esm/utils/base64.js
  var [charToIndex, indexToChar, paddingChar] = /* @__PURE__ */ (() => {
    const charToIndex2 = [];
    const indexToChar2 = [];
    const paddingChar2 = "=".charCodeAt(0);
    function addRange(start, end) {
      const charCodeStart = start.charCodeAt(0);
      const charCodeEnd = end.charCodeAt(0);
      for (let charCode = charCodeStart; charCode <= charCodeEnd; charCode += 1) {
        charToIndex2[charCode] = indexToChar2.length;
        indexToChar2.push(charCode);
      }
    }
    addRange("A", "Z");
    addRange("a", "z");
    addRange("0", "9");
    addRange("+", "+");
    addRange("/", "/");
    return [charToIndex2, indexToChar2, paddingChar2];
  })();
  function calculateBase64EncodedLength(inputLength) {
    const remainder = inputLength % 3;
    const paddingLength = remainder !== 0 ? 3 - remainder : 0;
    return [(inputLength + paddingLength) / 3 * 4, paddingLength];
  }
  function encodeBase64(input, output) {
    const [outputLength, paddingLength] = calculateBase64EncodedLength(input.length);
    if (!output) {
      output = new Uint8Array(outputLength);
      encodeForward(input, output, paddingLength);
      return output;
    } else {
      if (output.length < outputLength) {
        throw new TypeError("output buffer is too small");
      }
      output = output.subarray(0, outputLength);
      if (input.buffer !== output.buffer) {
        encodeForward(input, output, paddingLength);
      } else if (output.byteOffset + output.length - (paddingLength + 1) <= input.byteOffset + input.length) {
        encodeForward(input, output, paddingLength);
      } else if (output.byteOffset >= input.byteOffset - 1) {
        encodeBackward(input, output, paddingLength);
      } else {
        throw new TypeError("input and output cannot overlap");
      }
      return outputLength;
    }
  }
  function encodeForward(input, output, paddingLength) {
    let inputIndex = 0;
    let outputIndex = 0;
    while (inputIndex < input.length - 2) {
      const x = input[inputIndex];
      inputIndex += 1;
      const y = input[inputIndex];
      inputIndex += 1;
      const z = input[inputIndex];
      inputIndex += 1;
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex += 1;
      output[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
      outputIndex += 1;
      output[outputIndex] = indexToChar[(y & 15) << 2 | z >> 6];
      outputIndex += 1;
      output[outputIndex] = indexToChar[z & 63];
      outputIndex += 1;
    }
    if (paddingLength === 2) {
      const x = input[inputIndex];
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex += 1;
      output[outputIndex] = indexToChar[(x & 3) << 4];
      outputIndex += 1;
      output[outputIndex] = paddingChar;
      outputIndex += 1;
      output[outputIndex] = paddingChar;
    } else if (paddingLength === 1) {
      const x = input[inputIndex];
      inputIndex += 1;
      const y = input[inputIndex];
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex += 1;
      output[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
      outputIndex += 1;
      output[outputIndex] = indexToChar[(y & 15) << 2];
      outputIndex += 1;
      output[outputIndex] = paddingChar;
    }
  }
  function encodeBackward(input, output, paddingLength) {
    let inputIndex = input.length - 1;
    let outputIndex = output.length - 1;
    if (paddingLength === 2) {
      const x = input[inputIndex];
      inputIndex -= 1;
      output[outputIndex] = paddingChar;
      outputIndex -= 1;
      output[outputIndex] = paddingChar;
      outputIndex -= 1;
      output[outputIndex] = indexToChar[(x & 3) << 4];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex -= 1;
    } else if (paddingLength === 1) {
      const y = input[inputIndex];
      inputIndex -= 1;
      const x = input[inputIndex];
      inputIndex -= 1;
      output[outputIndex] = paddingChar;
      outputIndex -= 1;
      output[outputIndex] = indexToChar[(y & 15) << 2];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex -= 1;
    }
    while (inputIndex >= 0) {
      const z = input[inputIndex];
      inputIndex -= 1;
      const y = input[inputIndex];
      inputIndex -= 1;
      const x = input[inputIndex];
      inputIndex -= 1;
      output[outputIndex] = indexToChar[z & 63];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[(y & 15) << 2 | z >> 6];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
      outputIndex -= 1;
      output[outputIndex] = indexToChar[x >> 2];
      outputIndex -= 1;
    }
  }

  // node_modules/@yume-chan/adb/esm/utils/hex.js
  function hexCharToNumber(char) {
    if (char < 48) {
      throw new TypeError(`Invalid hex char ${char}`);
    }
    if (char < 58) {
      return char - 48;
    }
    if (char < 65) {
      throw new TypeError(`Invalid hex char ${char}`);
    }
    if (char < 71) {
      return char - 55;
    }
    if (char < 97) {
      throw new TypeError(`Invalid hex char ${char}`);
    }
    if (char < 103) {
      return char - 87;
    }
    throw new TypeError(`Invalid hex char ${char}`);
  }
  function hexToNumber(data) {
    let result = 0;
    for (let i = 0; i < data.length; i += 1) {
      result = result << 4 | hexCharToNumber(data[i]);
    }
    return result;
  }

  // node_modules/@yume-chan/adb/esm/utils/no-op.js
  var NOOP2 = /* @__NO_SIDE_EFFECTS__ */ () => {
  };
  function unreachable(...args) {
    throw new Error("Unreachable. Arguments:\n" + args.join("\n"));
  }

  // node_modules/@yume-chan/adb/esm/utils/sequence-equal.js
  function sequenceEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // node_modules/@yume-chan/adb/esm/commands/reverse.js
  var AdbReverseStringResponse = struct({
    length: string(4),
    content: string({
      field: "length",
      convert(value) {
        return Number.parseInt(value, 16);
      },
      back(value) {
        return value.toString(16).padStart(4, "0");
      }
    })
  }, { littleEndian: true });
  var AdbReverseError = class extends Error {
    constructor(message) {
      super(message);
    }
  };
  var AdbReverseNotSupportedError = class extends AdbReverseError {
    constructor() {
      super("ADB reverse tunnel is not supported on this device when connected wirelessly.");
    }
  };
  var AdbReverseErrorResponse = extend(AdbReverseStringResponse, {}, {
    postDeserialize(value) {
      if (value.content === "more than one device/emulator") {
        throw new AdbReverseNotSupportedError();
      } else {
        throw new AdbReverseError(value.content);
      }
    }
  });
  function decimalToNumber(buffer2) {
    let value = 0;
    for (const byte of buffer2) {
      if (byte < 48 || byte > 57) {
        return value;
      }
      value = value * 10 + byte - 48;
    }
    return value;
  }
  var OKAY = encodeUtf8("OKAY");
  var _deviceAddressToLocalAddress;
  var AdbReverseService = class extends AdbServiceBase {
    constructor() {
      super(...arguments);
      __privateAdd(this, _deviceAddressToLocalAddress, /* @__PURE__ */ new Map());
    }
    async createBufferedStream(service) {
      const socket = await this.adb.createSocket(service);
      return new BufferedReadableStream(socket.readable);
    }
    async sendRequest(service) {
      const stream = await this.createBufferedStream(service);
      const response = await stream.readExactly(4);
      if (!sequenceEqual(response, OKAY)) {
        await AdbReverseErrorResponse.deserialize(stream);
      }
      return stream;
    }
    /**
     * Get a list of all reverse port forwarding on the device.
     */
    async list() {
      const stream = await this.createBufferedStream("reverse:list-forward");
      const response = await AdbReverseStringResponse.deserialize(stream);
      return response.content.split("\n").filter((line) => !!line).map((line) => {
        const [deviceSerial, localName, remoteName] = line.split(" ");
        return { deviceSerial, localName, remoteName };
      });
    }
    /**
     * Add a reverse port forwarding for a program that already listens on a port.
     */
    async addExternal(deviceAddress, localAddress) {
      const stream = await this.sendRequest(`reverse:forward:${deviceAddress};${localAddress}`);
      if (deviceAddress.startsWith("tcp:")) {
        const position = stream.position;
        try {
          const length = hexToNumber(await stream.readExactly(4));
          const port = decimalToNumber(await stream.readExactly(length));
          deviceAddress = `tcp:${port}`;
        } catch (e) {
          if (e instanceof ExactReadableEndedError && stream.position === position) {
          } else {
            throw e;
          }
        }
      }
      return deviceAddress;
    }
    /**
     * Add a reverse port forwarding.
     */
    async add(deviceAddress, handler, localAddress) {
      localAddress = await this.adb.transport.addReverseTunnel(handler, localAddress);
      try {
        deviceAddress = await this.addExternal(deviceAddress, localAddress);
        __privateGet(this, _deviceAddressToLocalAddress).set(deviceAddress, localAddress);
        return deviceAddress;
      } catch (e) {
        await this.adb.transport.removeReverseTunnel(localAddress);
        throw e;
      }
    }
    /**
     * Remove a reverse port forwarding.
     */
    async remove(deviceAddress) {
      const localAddress = __privateGet(this, _deviceAddressToLocalAddress).get(deviceAddress);
      if (localAddress) {
        await this.adb.transport.removeReverseTunnel(localAddress);
      }
      await this.sendRequest(`reverse:killforward:${deviceAddress}`);
    }
    /**
     * Remove all reverse port forwarding, including the ones added by other programs.
     */
    async removeAll() {
      await this.adb.transport.clearReverseTunnels();
      __privateGet(this, _deviceAddressToLocalAddress).clear();
      await this.sendRequest(`reverse:killforward-all`);
    }
  };
  _deviceAddressToLocalAddress = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/none/process.js
  var _socket, _exited;
  var AdbNoneProtocolProcessImpl = class {
    constructor(socket, signal) {
      __privateAdd(this, _socket);
      __privateAdd(this, _exited);
      __privateSet(this, _socket, socket);
      if (signal) {
        const exited = new PromiseResolver();
        __privateGet(this, _socket).closed.then(() => exited.resolve(void 0), (e) => exited.reject(e));
        signal.addEventListener("abort", () => {
          exited.reject(signal.reason);
          __privateGet(this, _socket).close();
        });
        __privateSet(this, _exited, exited.promise);
      } else {
        __privateSet(this, _exited, __privateGet(this, _socket).closed);
      }
    }
    get stdin() {
      return __privateGet(this, _socket).writable;
    }
    get output() {
      return __privateGet(this, _socket).readable;
    }
    get exited() {
      return __privateGet(this, _exited);
    }
    kill() {
      return __privateGet(this, _socket).close();
    }
  };
  _socket = new WeakMap();
  _exited = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/none/pty.js
  var _socket2, _writer, _input;
  var AdbNoneProtocolPtyProcess = class {
    constructor(socket) {
      __privateAdd(this, _socket2);
      __privateAdd(this, _writer);
      __privateAdd(this, _input);
      __privateSet(this, _socket2, socket);
      __privateSet(this, _writer, __privateGet(this, _socket2).writable.getWriter());
      __privateSet(this, _input, new maybe_consumable_exports.WritableStream({
        write: (chunk) => __privateGet(this, _writer).write(chunk)
      }));
    }
    get input() {
      return __privateGet(this, _input);
    }
    get output() {
      return __privateGet(this, _socket2).readable;
    }
    get exited() {
      return __privateGet(this, _socket2).closed;
    }
    sigint() {
      return __privateGet(this, _writer).write(new Uint8Array([3]));
    }
    kill() {
      return __privateGet(this, _socket2).close();
    }
  };
  _socket2 = new WeakMap();
  _writer = new WeakMap();
  _input = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/utils.js
  function escapeArg(s) {
    let result = "";
    result += `'`;
    let base = 0;
    while (true) {
      const found = s.indexOf(`'`, base);
      if (found === -1) {
        result += s.substring(base);
        break;
      }
      result += s.substring(base, found);
      result += String.raw`'\''`;
      base = found + 1;
    }
    result += `'`;
    return result;
  }
  function splitCommand(command) {
    const result = [];
    let quote;
    let isEscaped = false;
    let start = 0;
    for (let i = 0, len = command.length; i < len; i += 1) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      const char = command.charAt(i);
      switch (char) {
        case " ":
          if (!quote && i !== start) {
            result.push(command.substring(start, i));
            start = i + 1;
          }
          break;
        case "'":
        case '"':
          if (!quote) {
            quote = char;
          } else if (char === quote) {
            quote = void 0;
          }
          break;
        case "\\":
          isEscaped = true;
          break;
      }
    }
    if (start < command.length) {
      result.push(command.substring(start));
    }
    return result;
  }

  // node_modules/@yume-chan/adb/esm/commands/subprocess/none/spawner.js
  var _spawn;
  var AdbNoneProtocolSpawner = class {
    constructor(spawn) {
      __privateAdd(this, _spawn);
      __privateSet(this, _spawn, spawn);
    }
    spawn(command, signal) {
      signal?.throwIfAborted();
      if (typeof command === "string") {
        command = splitCommand(command);
      }
      return __privateGet(this, _spawn).call(this, command, signal);
    }
    async spawnWait(command) {
      const process = await this.spawn(command);
      return await process.output.pipeThrough(new ConcatBufferStream());
    }
    async spawnWaitText(command) {
      const process = await this.spawn(command);
      return await process.output.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
    }
  };
  _spawn = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/none/service.js
  var _adb2;
  var AdbNoneProtocolSubprocessService = class extends AdbNoneProtocolSpawner {
    constructor(adb2) {
      super(async (command, signal) => {
        const socket = await __privateGet(this, _adb2).createSocket(`exec:${command.join(" ")}`);
        if (signal?.aborted) {
          await socket.close();
          throw signal.reason;
        }
        return new AdbNoneProtocolProcessImpl(socket, signal);
      });
      __privateAdd(this, _adb2);
      __privateSet(this, _adb2, adb2);
    }
    get adb() {
      return __privateGet(this, _adb2);
    }
    async pty(command) {
      if (command === void 0) {
        command = "";
      } else if (Array.isArray(command)) {
        command = command.join(" ");
      }
      return new AdbNoneProtocolPtyProcess(
        // https://github.com/microsoft/typescript/issues/17002
        await __privateGet(this, _adb2).createSocket(`shell:${command}`)
      );
    }
  };
  _adb2 = new WeakMap();

  // node_modules/@yume-chan/adb/esm/features.js
  var AdbFeature = {
    ShellV2: "shell_v2",
    Cmd: "cmd",
    StatV2: "stat_v2",
    ListV2: "ls_v2",
    FixedPushMkdir: "fixed_push_mkdir",
    Abb: "abb",
    AbbExec: "abb_exec",
    SendReceiveV2: "sendrecv_v2",
    DelayedAck: "delayed_ack"
  };

  // node_modules/@yume-chan/adb/esm/commands/subprocess/shell/shared.js
  var AdbShellProtocolId = {
    Stdin: 0,
    Stdout: 1,
    Stderr: 2,
    Exit: 3,
    CloseStdin: 4,
    WindowSizeChange: 5
  };
  var AdbShellProtocolPacket = struct({
    id: u8(),
    data: buffer(u32)
  }, { littleEndian: true });

  // node_modules/@yume-chan/adb/esm/commands/subprocess/shell/process.js
  var _socket3, _writer2, _stdin, _stdout, _stderr, _exited2;
  var AdbShellProtocolProcessImpl = class {
    constructor(socket, signal) {
      __privateAdd(this, _socket3);
      __privateAdd(this, _writer2);
      __privateAdd(this, _stdin);
      __privateAdd(this, _stdout);
      __privateAdd(this, _stderr);
      __privateAdd(this, _exited2);
      __privateSet(this, _socket3, socket);
      let stdoutController;
      let stderrController;
      __privateSet(this, _stdout, new PushReadableStream((controller) => {
        stdoutController = controller;
      }));
      __privateSet(this, _stderr, new PushReadableStream((controller) => {
        stderrController = controller;
      }));
      const exited = new PromiseResolver();
      __privateSet(this, _exited2, exited.promise);
      socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
        write: async (chunk) => {
          switch (chunk.id) {
            case AdbShellProtocolId.Exit:
              exited.resolve(chunk.data[0]);
              break;
            case AdbShellProtocolId.Stdout:
              await stdoutController.enqueue(chunk.data);
              break;
            case AdbShellProtocolId.Stderr:
              await stderrController.enqueue(chunk.data);
              break;
            default:
              break;
          }
        }
      })).then(() => {
        stdoutController.close();
        stderrController.close();
        exited.reject(new Error("Socket ended without exit message"));
      }, (e) => {
        stdoutController.error(e);
        stderrController.error(e);
        exited.reject(e);
      });
      if (signal) {
        signal.addEventListener("abort", () => {
          exited.reject(signal.reason);
          __privateGet(this, _socket3).close();
        });
      }
      __privateSet(this, _writer2, __privateGet(this, _socket3).writable.getWriter());
      __privateSet(this, _stdin, new maybe_consumable_exports.WritableStream({
        write: async (chunk) => {
          await __privateGet(this, _writer2).write(AdbShellProtocolPacket.serialize({
            id: AdbShellProtocolId.Stdin,
            data: chunk
          }));
        },
        close: () => (
          // Only shell protocol + raw mode supports closing stdin
          __privateGet(this, _writer2).write(AdbShellProtocolPacket.serialize({
            id: AdbShellProtocolId.CloseStdin,
            data: EmptyUint8Array
          }))
        )
      }));
    }
    get stdin() {
      return __privateGet(this, _stdin);
    }
    get stdout() {
      return __privateGet(this, _stdout);
    }
    get stderr() {
      return __privateGet(this, _stderr);
    }
    get exited() {
      return __privateGet(this, _exited2);
    }
    kill() {
      return __privateGet(this, _socket3).close();
    }
  };
  _socket3 = new WeakMap();
  _writer2 = new WeakMap();
  _stdin = new WeakMap();
  _stdout = new WeakMap();
  _stderr = new WeakMap();
  _exited2 = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/shell/pty.js
  var _socket4, _writer3, _input2, _stdout2, _exited3, _AdbShellProtocolPtyProcess_instances, writeStdin_fn;
  var AdbShellProtocolPtyProcess = class {
    constructor(socket) {
      __privateAdd(this, _AdbShellProtocolPtyProcess_instances);
      __privateAdd(this, _socket4);
      __privateAdd(this, _writer3);
      __privateAdd(this, _input2);
      __privateAdd(this, _stdout2);
      __privateAdd(this, _exited3, new PromiseResolver());
      __privateSet(this, _socket4, socket);
      let stdoutController;
      __privateSet(this, _stdout2, new PushReadableStream((controller) => {
        stdoutController = controller;
      }));
      socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
        write: async (chunk) => {
          switch (chunk.id) {
            case AdbShellProtocolId.Exit:
              __privateGet(this, _exited3).resolve(chunk.data[0]);
              break;
            case AdbShellProtocolId.Stdout:
              await stdoutController.enqueue(chunk.data);
              break;
          }
        }
      })).then(() => {
        stdoutController.close();
        __privateGet(this, _exited3).reject(new Error("Socket ended without exit message"));
      }, (e) => {
        stdoutController.error(e);
        __privateGet(this, _exited3).reject(e);
      });
      __privateSet(this, _writer3, __privateGet(this, _socket4).writable.getWriter());
      __privateSet(this, _input2, new maybe_consumable_exports.WritableStream({
        write: (chunk) => __privateMethod(this, _AdbShellProtocolPtyProcess_instances, writeStdin_fn).call(this, chunk)
      }));
    }
    get input() {
      return __privateGet(this, _input2);
    }
    get output() {
      return __privateGet(this, _stdout2);
    }
    get exited() {
      return __privateGet(this, _exited3).promise;
    }
    async resize(rows, cols) {
      await __privateGet(this, _writer3).write(AdbShellProtocolPacket.serialize({
        id: AdbShellProtocolId.WindowSizeChange,
        // The "correct" format is `${rows}x${cols},${x_pixels}x${y_pixels}`
        // However, according to https://linux.die.net/man/4/tty_ioctl
        // `x_pixels` and `y_pixels` are unused, so always sending `0` should be fine.
        data: encodeUtf8(`${rows}x${cols},0x0\0`)
      }));
    }
    sigint() {
      return __privateMethod(this, _AdbShellProtocolPtyProcess_instances, writeStdin_fn).call(this, new Uint8Array([3]));
    }
    kill() {
      return __privateGet(this, _socket4).close();
    }
  };
  _socket4 = new WeakMap();
  _writer3 = new WeakMap();
  _input2 = new WeakMap();
  _stdout2 = new WeakMap();
  _exited3 = new WeakMap();
  _AdbShellProtocolPtyProcess_instances = new WeakSet();
  writeStdin_fn = function(chunk) {
    return __privateGet(this, _writer3).write(AdbShellProtocolPacket.serialize({
      id: AdbShellProtocolId.Stdin,
      data: chunk
    }));
  };

  // node_modules/@yume-chan/adb/esm/commands/subprocess/shell/spawner.js
  var _spawn2;
  var AdbShellProtocolSpawner = class {
    constructor(spawn) {
      __privateAdd(this, _spawn2);
      __privateSet(this, _spawn2, spawn);
    }
    spawn(command, signal) {
      signal?.throwIfAborted();
      if (typeof command === "string") {
        command = splitCommand(command);
      }
      return __privateGet(this, _spawn2).call(this, command, signal);
    }
    async spawnWait(command) {
      const process = await this.spawn(command);
      const [stdout, stderr, exitCode] = await Promise.all([
        process.stdout.pipeThrough(new ConcatBufferStream()),
        process.stderr.pipeThrough(new ConcatBufferStream()),
        process.exited
      ]);
      return { stdout, stderr, exitCode };
    }
    async spawnWaitText(command) {
      const process = await this.spawn(command);
      const [stdout, stderr, exitCode] = await Promise.all([
        process.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
        process.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
        process.exited
      ]);
      return { stdout, stderr, exitCode };
    }
  };
  _spawn2 = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/shell/service.js
  var _adb3;
  var AdbShellProtocolSubprocessService = class extends AdbShellProtocolSpawner {
    constructor(adb2) {
      super(async (command, signal) => {
        const socket = await __privateGet(this, _adb3).createSocket(`shell,v2,raw:${command.join(" ")}`);
        if (signal?.aborted) {
          await socket.close();
          throw signal.reason;
        }
        return new AdbShellProtocolProcessImpl(socket, signal);
      });
      __privateAdd(this, _adb3);
      __privateSet(this, _adb3, adb2);
    }
    get adb() {
      return __privateGet(this, _adb3);
    }
    get isSupported() {
      return __privateGet(this, _adb3).canUseFeature(AdbFeature.ShellV2);
    }
    async pty(options) {
      let service = "shell,v2,pty";
      if (options?.terminalType) {
        service += `,TERM=` + options.terminalType;
      }
      service += ":";
      if (options) {
        if (typeof options.command === "string") {
          service += options.command;
        } else if (Array.isArray(options.command)) {
          service += options.command.join(" ");
        }
      }
      return new AdbShellProtocolPtyProcess(await __privateGet(this, _adb3).createSocket(service));
    }
  };
  _adb3 = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/subprocess/service.js
  var _adb4, _noneProtocol, _shellProtocol;
  var AdbSubprocessService = class {
    constructor(adb2) {
      __privateAdd(this, _adb4);
      __privateAdd(this, _noneProtocol);
      __privateAdd(this, _shellProtocol);
      __privateSet(this, _adb4, adb2);
      __privateSet(this, _noneProtocol, new AdbNoneProtocolSubprocessService(adb2));
      if (adb2.canUseFeature(AdbFeature.ShellV2)) {
        __privateSet(this, _shellProtocol, new AdbShellProtocolSubprocessService(adb2));
      }
    }
    get adb() {
      return __privateGet(this, _adb4);
    }
    get noneProtocol() {
      return __privateGet(this, _noneProtocol);
    }
    get shellProtocol() {
      return __privateGet(this, _shellProtocol);
    }
  };
  _adb4 = new WeakMap();
  _noneProtocol = new WeakMap();
  _shellProtocol = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/sync/response.js
  function encodeAsciiUnchecked(value) {
    const result = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i += 1) {
      result[i] = value.charCodeAt(i);
    }
    return result;
  }
  // @__NO_SIDE_EFFECTS__
  function adbSyncEncodeId(value) {
    const buffer2 = encodeAsciiUnchecked(value);
    return getUint32LittleEndian(buffer2, 0);
  }
  var AdbSyncResponseId = {
    Entry: /* @__PURE__ */ adbSyncEncodeId("DENT"),
    Entry2: /* @__PURE__ */ adbSyncEncodeId("DNT2"),
    Lstat: /* @__PURE__ */ adbSyncEncodeId("STAT"),
    Stat: /* @__PURE__ */ adbSyncEncodeId("STA2"),
    Lstat2: /* @__PURE__ */ adbSyncEncodeId("LST2"),
    Done: /* @__PURE__ */ adbSyncEncodeId("DONE"),
    Data: /* @__PURE__ */ adbSyncEncodeId("DATA"),
    Ok: /* @__PURE__ */ adbSyncEncodeId("OKAY"),
    Fail: /* @__PURE__ */ adbSyncEncodeId("FAIL")
  };
  var AdbSyncError = class extends Error {
  };
  var AdbSyncFailResponse = struct({ message: string(u32) }, {
    littleEndian: true,
    postDeserialize(value) {
      throw new AdbSyncError(value.message);
    }
  });
  async function adbSyncReadResponse(stream, id, type) {
    if (typeof id === "string") {
      id = /* @__PURE__ */ adbSyncEncodeId(id);
    }
    const buffer2 = await stream.readExactly(4);
    switch (getUint32LittleEndian(buffer2, 0)) {
      case AdbSyncResponseId.Fail:
        await AdbSyncFailResponse.deserialize(stream);
        throw new Error("Unreachable");
      case id:
        return await type.deserialize(stream);
      default:
        throw new Error(`Expected '${id}', but got '${decodeUtf8(buffer2)}'`);
    }
  }
  async function* adbSyncReadResponses(stream, id, type) {
    if (typeof id === "string") {
      id = /* @__PURE__ */ adbSyncEncodeId(id);
    }
    while (true) {
      const buffer2 = await stream.readExactly(4);
      switch (getUint32LittleEndian(buffer2, 0)) {
        case AdbSyncResponseId.Fail:
          await AdbSyncFailResponse.deserialize(stream);
          unreachable();
        case AdbSyncResponseId.Done:
          await stream.readExactly(type.size);
          return;
        case id:
          yield await type.deserialize(stream);
          break;
        default:
          throw new Error(`Expected '${id}' or '${AdbSyncResponseId.Done}', but got '${decodeUtf8(buffer2)}'`);
      }
    }
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/request.js
  var AdbSyncRequestId = {
    List: adbSyncEncodeId("LIST"),
    ListV2: adbSyncEncodeId("LIS2"),
    Send: adbSyncEncodeId("SEND"),
    SendV2: adbSyncEncodeId("SND2"),
    Lstat: adbSyncEncodeId("STAT"),
    Stat: adbSyncEncodeId("STA2"),
    LstatV2: adbSyncEncodeId("LST2"),
    Data: adbSyncEncodeId("DATA"),
    Done: adbSyncEncodeId("DONE"),
    Receive: adbSyncEncodeId("RECV")
  };
  var AdbSyncNumberRequest = struct({ id: u32, arg: u32 }, { littleEndian: true });
  async function adbSyncWriteRequest(writable, id, value) {
    if (typeof id === "string") {
      id = adbSyncEncodeId(id);
    }
    if (typeof value === "number") {
      await writable.write(AdbSyncNumberRequest.serialize({ id, arg: value }));
      return;
    }
    if (typeof value === "string") {
      value = encodeUtf8(value);
    }
    await writable.write(AdbSyncNumberRequest.serialize({ id, arg: value.length }));
    await writable.write(value);
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/stat.js
  var LinuxFileType = {
    Directory: 4,
    File: 8,
    Link: 10
  };
  var AdbSyncLstatResponse = struct({ mode: u32, size: u32, mtime: u32 }, {
    littleEndian: true,
    extra: {
      get type() {
        return this.mode >> 12;
      },
      get permission() {
        return this.mode & 4095;
      }
    },
    postDeserialize(value) {
      if (value.mode === 0 && value.size === 0 && value.mtime === 0) {
        throw new Error("lstat error");
      }
      return value;
    }
  });
  var AdbSyncStatErrorCode = {
    SUCCESS: 0,
    EACCES: 13,
    EEXIST: 17,
    EFAULT: 14,
    EFBIG: 27,
    EINTR: 4,
    EINVAL: 22,
    EIO: 5,
    EISDIR: 21,
    ELOOP: 40,
    EMFILE: 24,
    ENAMETOOLONG: 36,
    ENFILE: 23,
    ENOENT: 2,
    ENOMEM: 12,
    ENOSPC: 28,
    ENOTDIR: 20,
    EOVERFLOW: 75,
    EPERM: 1,
    EROFS: 30,
    ETXTBSY: 26
  };
  var AdbSyncStatErrorName = /* @__PURE__ */ (() => Object.fromEntries(Object.entries(AdbSyncStatErrorCode).map(([key, value]) => [
    value,
    key
  ])))();
  var AdbSyncStatResponse = struct({
    error: u32(),
    dev: u64,
    ino: u64,
    mode: u32,
    nlink: u32,
    uid: u32,
    gid: u32,
    size: u64,
    atime: u64,
    mtime: u64,
    ctime: u64
  }, {
    littleEndian: true,
    extra: {
      get type() {
        return this.mode >> 12;
      },
      get permission() {
        return this.mode & 4095;
      }
    },
    postDeserialize(value) {
      if (value.error) {
        throw new Error(AdbSyncStatErrorName[value.error]);
      }
      return value;
    }
  });
  async function adbSyncLstat(socket, path, v2) {
    const locked = await socket.lock();
    try {
      if (v2) {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.LstatV2, path);
        return await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat2, AdbSyncStatResponse);
      } else {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.Lstat, path);
        const response = await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat, AdbSyncLstatResponse);
        return {
          mode: response.mode,
          // Convert to `BigInt` to make it compatible with `AdbSyncStatResponse`
          size: BigInt(response.size),
          mtime: BigInt(response.mtime),
          get type() {
            return response.type;
          },
          get permission() {
            return response.permission;
          }
        };
      }
    } finally {
      locked.release();
    }
  }
  async function adbSyncStat(socket, path) {
    const locked = await socket.lock();
    try {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.Stat, path);
      return await adbSyncReadResponse(locked, AdbSyncResponseId.Stat, AdbSyncStatResponse);
    } finally {
      locked.release();
    }
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/list.js
  var AdbSyncEntryResponse = extend(AdbSyncLstatResponse, {
    name: string(u32)
  });
  var AdbSyncEntry2Response = extend(AdbSyncStatResponse, {
    name: string(u32)
  });
  async function* adbSyncOpenDirV2(socket, path) {
    const locked = await socket.lock();
    try {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.ListV2, path);
      for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry2, AdbSyncEntry2Response)) {
        if (item.error !== AdbSyncStatErrorCode.SUCCESS) {
          continue;
        }
        yield item;
      }
    } finally {
      locked.release();
    }
  }
  async function* adbSyncOpenDirV1(socket, path) {
    const locked = await socket.lock();
    try {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.List, path);
      for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry, AdbSyncEntryResponse)) {
        yield item;
      }
    } finally {
      locked.release();
    }
  }
  async function* adbSyncOpenDir(socket, path, v2) {
    if (v2) {
      yield* adbSyncOpenDirV2(socket, path);
    } else {
      for await (const item of adbSyncOpenDirV1(socket, path)) {
        yield {
          mode: item.mode,
          size: BigInt(item.size),
          mtime: BigInt(item.mtime),
          get type() {
            return item.type;
          },
          get permission() {
            return item.permission;
          },
          name: item.name
        };
      }
    }
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/pull.js
  var AdbSyncDataResponse = struct({ data: buffer(u32) }, { littleEndian: true });
  async function* adbSyncPullGenerator(socket, path) {
    const locked = await socket.lock();
    let done = false;
    try {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.Receive, path);
      for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse)) {
        yield packet.data;
      }
      done = true;
    } catch (e) {
      done = true;
      throw e;
    } finally {
      if (!done) {
        for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse)) {
          void packet;
        }
      }
      locked.release();
    }
  }
  function adbSyncPull(socket, path) {
    return ReadableStream.from(adbSyncPullGenerator(socket, path));
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/push.js
  var ADB_SYNC_MAX_PACKET_SIZE = 64 * 1024;
  var AdbSyncOkResponse = struct({ unused: u32 }, { littleEndian: true });
  async function pipeFileData(locked, file, packetSize, mtime) {
    const abortController = new AbortController();
    file.pipeThrough(new DistributionStream(packetSize, true)).pipeTo(new maybe_consumable_exports.WritableStream({
      write(chunk) {
        return adbSyncWriteRequest(locked, AdbSyncRequestId.Data, chunk);
      }
    }), { signal: abortController.signal }).then(async () => {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.Done, mtime);
      await locked.flush();
    }, NOOP2);
    await adbSyncReadResponse(locked, AdbSyncResponseId.Ok, AdbSyncOkResponse).catch((e) => {
      abortController.abort();
      throw e;
    });
  }
  async function adbSyncPushV1({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1e3 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE }) {
    const locked = await socket.lock();
    try {
      const mode = type << 12 | permission;
      const pathAndMode = `${filename},${mode.toString()}`;
      await adbSyncWriteRequest(locked, AdbSyncRequestId.Send, pathAndMode);
      await pipeFileData(locked, file, packetSize, mtime);
    } finally {
      locked.release();
    }
  }
  var AdbSyncSendV2Flags = {
    None: 0,
    Brotli: 1,
    /**
     * 2
     */
    Lz4: 1 << 1,
    /**
     * 4
     */
    Zstd: 1 << 2,
    DryRun: 2147483648
  };
  var AdbSyncSendV2Request = struct({ id: u32, mode: u32, flags: u32() }, { littleEndian: true });
  async function adbSyncPushV2({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1e3 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE, dryRun = false }) {
    const locked = await socket.lock();
    try {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.SendV2, filename);
      const mode = type << 12 | permission;
      let flags = AdbSyncSendV2Flags.None;
      if (dryRun) {
        flags |= AdbSyncSendV2Flags.DryRun;
      }
      await locked.write(AdbSyncSendV2Request.serialize({
        id: AdbSyncRequestId.SendV2,
        mode,
        flags
      }));
      await pipeFileData(locked, file, packetSize, mtime);
    } finally {
      locked.release();
    }
  }
  function adbSyncPush(options) {
    if (options.v2) {
      return adbSyncPushV2(options);
    }
    if (options.dryRun) {
      throw new Error("dryRun is not supported in v1");
    }
    return adbSyncPushV1(options);
  }

  // node_modules/@yume-chan/adb/esm/commands/sync/socket.js
  var _writer4, _readable4, _socketLock, _writeLock, _combiner, _AdbSyncSocketLocked_instances, write_fn;
  var AdbSyncSocketLocked = class {
    constructor(writer, readable, bufferSize, lock) {
      __privateAdd(this, _AdbSyncSocketLocked_instances);
      __privateAdd(this, _writer4);
      __privateAdd(this, _readable4);
      __privateAdd(this, _socketLock);
      __privateAdd(this, _writeLock, new AutoResetEvent());
      __privateAdd(this, _combiner);
      __privateSet(this, _writer4, writer);
      __privateSet(this, _readable4, readable);
      __privateSet(this, _socketLock, lock);
      __privateSet(this, _combiner, new BufferCombiner(bufferSize));
    }
    get position() {
      return __privateGet(this, _readable4).position;
    }
    async flush() {
      try {
        await __privateGet(this, _writeLock).wait();
        const buffer2 = __privateGet(this, _combiner).flush();
        if (buffer2) {
          await __privateMethod(this, _AdbSyncSocketLocked_instances, write_fn).call(this, buffer2);
        }
      } finally {
        __privateGet(this, _writeLock).notifyOne();
      }
    }
    async write(data) {
      try {
        await __privateGet(this, _writeLock).wait();
        for (const buffer2 of __privateGet(this, _combiner).push(data)) {
          await __privateMethod(this, _AdbSyncSocketLocked_instances, write_fn).call(this, buffer2);
        }
      } finally {
        __privateGet(this, _writeLock).notifyOne();
      }
    }
    async readExactly(length) {
      await this.flush();
      return await __privateGet(this, _readable4).readExactly(length);
    }
    release() {
      __privateGet(this, _combiner).flush();
      __privateGet(this, _socketLock).notifyOne();
    }
    async close() {
      await __privateGet(this, _readable4).cancel();
    }
  };
  _writer4 = new WeakMap();
  _readable4 = new WeakMap();
  _socketLock = new WeakMap();
  _writeLock = new WeakMap();
  _combiner = new WeakMap();
  _AdbSyncSocketLocked_instances = new WeakSet();
  write_fn = function(buffer2) {
    return Consumable.WritableStream.write(__privateGet(this, _writer4), buffer2);
  };
  var _lock, _socket5, _locked;
  var AdbSyncSocket = class {
    constructor(socket, bufferSize) {
      __privateAdd(this, _lock, new AutoResetEvent());
      __privateAdd(this, _socket5);
      __privateAdd(this, _locked);
      __privateSet(this, _socket5, socket);
      __privateSet(this, _locked, new AdbSyncSocketLocked(socket.writable.getWriter(), new BufferedReadableStream(socket.readable), bufferSize, __privateGet(this, _lock)));
    }
    async lock() {
      await __privateGet(this, _lock).wait();
      return __privateGet(this, _locked);
    }
    async close() {
      await __privateGet(this, _locked).close();
      await __privateGet(this, _socket5).close();
    }
  };
  _lock = new WeakMap();
  _socket5 = new WeakMap();
  _locked = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/sync/sync.js
  function dirname(path) {
    const end = path.lastIndexOf("/");
    if (end === -1) {
      throw new Error(`Invalid path`);
    }
    if (end === 0) {
      return "/";
    }
    return path.substring(0, end);
  }
  var _supportsStat, _supportsListV2, _fixedPushMkdir, _supportsSendReceiveV2, _needPushMkdirWorkaround;
  var AdbSync = class {
    constructor(adb2, socket) {
      __publicField(this, "_adb");
      __publicField(this, "_socket");
      __privateAdd(this, _supportsStat);
      __privateAdd(this, _supportsListV2);
      __privateAdd(this, _fixedPushMkdir);
      __privateAdd(this, _supportsSendReceiveV2);
      __privateAdd(this, _needPushMkdirWorkaround);
      this._adb = adb2;
      this._socket = new AdbSyncSocket(socket, adb2.maxPayloadSize);
      __privateSet(this, _supportsStat, adb2.canUseFeature(AdbFeature.StatV2));
      __privateSet(this, _supportsListV2, adb2.canUseFeature(AdbFeature.ListV2));
      __privateSet(this, _fixedPushMkdir, adb2.canUseFeature(AdbFeature.FixedPushMkdir));
      __privateSet(this, _supportsSendReceiveV2, adb2.canUseFeature(AdbFeature.SendReceiveV2));
      __privateSet(this, _needPushMkdirWorkaround, this._adb.canUseFeature(AdbFeature.ShellV2) && !this.fixedPushMkdir);
    }
    get supportsStat() {
      return __privateGet(this, _supportsStat);
    }
    get supportsListV2() {
      return __privateGet(this, _supportsListV2);
    }
    get fixedPushMkdir() {
      return __privateGet(this, _fixedPushMkdir);
    }
    get supportsSendReceiveV2() {
      return __privateGet(this, _supportsSendReceiveV2);
    }
    get needPushMkdirWorkaround() {
      return __privateGet(this, _needPushMkdirWorkaround);
    }
    /**
     * Gets information of a file or folder.
     *
     * If `path` points to a symbolic link, the returned information is about the link itself (with `type` being `LinuxFileType.Link`).
     */
    async lstat(path) {
      return await adbSyncLstat(this._socket, path, __privateGet(this, _supportsStat));
    }
    /**
     * Gets the information of a file or folder.
     *
     * If `path` points to a symbolic link, it will be resolved and the returned information is about the target (with `type` being `LinuxFileType.File` or `LinuxFileType.Directory`).
     */
    async stat(path) {
      if (!__privateGet(this, _supportsStat)) {
        throw new Error("Not supported");
      }
      return await adbSyncStat(this._socket, path);
    }
    /**
     * Checks if `path` is a directory, or a symbolic link to a directory.
     *
     * This uses `lstat` internally, thus works on all Android versions.
     */
    async isDirectory(path) {
      try {
        await this.lstat(path + "/");
        return true;
      } catch {
        return false;
      }
    }
    opendir(path) {
      return adbSyncOpenDir(this._socket, path, this.supportsListV2);
    }
    async readdir(path) {
      const results = [];
      for await (const entry of this.opendir(path)) {
        results.push(entry);
      }
      return results;
    }
    /**
     * Reads the content of a file on device.
     *
     * @param filename The full path of the file on device to read.
     * @returns A `ReadableStream` that contains the file content.
     */
    read(filename) {
      return adbSyncPull(this._socket, filename);
    }
    /**
     * Writes a file on device. If the file name already exists, it will be overwritten.
     *
     * @param options The content and options of the file to write.
     */
    async write(options) {
      if (this.needPushMkdirWorkaround) {
        await this._adb.subprocess.noneProtocol.spawnWait([
          "mkdir",
          "-p",
          escapeArg(dirname(options.filename))
        ]);
      }
      await adbSyncPush({
        v2: this.supportsSendReceiveV2,
        socket: this._socket,
        ...options
      });
    }
    lockSocket() {
      return this._socket.lock();
    }
    dispose() {
      return this._socket.close();
    }
  };
  _supportsStat = new WeakMap();
  _supportsListV2 = new WeakMap();
  _fixedPushMkdir = new WeakMap();
  _supportsSendReceiveV2 = new WeakMap();
  _needPushMkdirWorkaround = new WeakMap();

  // node_modules/@yume-chan/adb/esm/commands/tcpip.js
  function parsePort(value) {
    if (!value || value === "0") {
      return void 0;
    }
    return Number.parseInt(value, 10);
  }
  var AdbTcpIpService = class extends AdbServiceBase {
    async getListenAddresses() {
      const serviceListenAddresses = await this.adb.getProp("service.adb.listen_addrs");
      const servicePort = await this.adb.getProp("service.adb.tcp.port");
      const persistPort = await this.adb.getProp("persist.adb.tcp.port");
      return {
        serviceListenAddresses: serviceListenAddresses != "" ? serviceListenAddresses.split(",") : [],
        servicePort: parsePort(servicePort),
        persistPort: parsePort(persistPort)
      };
    }
    async setPort(port) {
      if (port <= 0) {
        throw new TypeError(`Invalid port ${port}`);
      }
      const output = await this.adb.createSocketAndWait(`tcpip:${port}`);
      if (output !== `restarting in TCP mode port: ${port}
`) {
        throw new Error(output);
      }
      return output;
    }
    async disable() {
      const output = await this.adb.createSocketAndWait("usb:");
      if (output !== "restarting in USB mode\n") {
        throw new Error(output);
      }
      return output;
    }
  };

  // node_modules/@yume-chan/adb/esm/adb.js
  var _transport;
  var Adb = class {
    constructor(transport) {
      __privateAdd(this, _transport);
      __publicField(this, "subprocess");
      __publicField(this, "power");
      __publicField(this, "reverse");
      __publicField(this, "tcpip");
      __privateSet(this, _transport, transport);
      this.subprocess = new AdbSubprocessService(this);
      this.power = new AdbPower(this);
      this.reverse = new AdbReverseService(this);
      this.tcpip = new AdbTcpIpService(this);
    }
    get transport() {
      return __privateGet(this, _transport);
    }
    get serial() {
      return __privateGet(this, _transport).serial;
    }
    get maxPayloadSize() {
      return __privateGet(this, _transport).maxPayloadSize;
    }
    get banner() {
      return __privateGet(this, _transport).banner;
    }
    get disconnected() {
      return __privateGet(this, _transport).disconnected;
    }
    get clientFeatures() {
      return __privateGet(this, _transport).clientFeatures;
    }
    get deviceFeatures() {
      return this.banner.features;
    }
    canUseFeature(feature) {
      return this.clientFeatures.includes(feature) && this.deviceFeatures.includes(feature);
    }
    /**
     * Creates a new ADB Socket to the specified service or socket address.
     */
    async createSocket(service) {
      return __privateGet(this, _transport).connect(service);
    }
    async createSocketAndWait(service) {
      const socket = await this.createSocket(service);
      return await socket.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
    }
    getProp(key) {
      return this.subprocess.noneProtocol.spawnWaitText(["getprop", key]).then((output) => output.trim());
    }
    rm(filenames, options) {
      const args = ["rm"];
      if (options?.recursive) {
        args.push("-r");
      }
      if (options?.force) {
        args.push("-f");
      }
      if (Array.isArray(filenames)) {
        for (const filename of filenames) {
          args.push(escapeArg(filename));
        }
      } else {
        args.push(escapeArg(filenames));
      }
      args.push("</dev/null");
      return this.subprocess.noneProtocol.spawnWaitText(args);
    }
    async sync() {
      const socket = await this.createSocket("sync:");
      return new AdbSync(this, socket);
    }
    async framebuffer() {
      return framebuffer(this);
    }
    async close() {
      await __privateGet(this, _transport).close();
    }
  };
  _transport = new WeakMap();

  // node_modules/@yume-chan/adb/esm/banner.js
  var AdbBannerKey = {
    Product: "ro.product.name",
    Model: "ro.product.model",
    Device: "ro.product.device",
    Features: "features"
  };
  var _state2, _product, _model, _device, _features;
  var _AdbBanner = class _AdbBanner {
    // eslint-disable-next-line @typescript-eslint/max-params
    constructor(state, product, model, device, features) {
      __privateAdd(this, _state2);
      __privateAdd(this, _product);
      __privateAdd(this, _model);
      __privateAdd(this, _device);
      __privateAdd(this, _features, []);
      __privateSet(this, _state2, state);
      __privateSet(this, _product, product);
      __privateSet(this, _model, model);
      __privateSet(this, _device, device);
      __privateSet(this, _features, features);
    }
    static parse(banner) {
      let state;
      let product;
      let model;
      let device;
      let features = [];
      const pieces = banner.split("::");
      if (pieces.length > 1) {
        state = pieces[0].trim() || void 0;
        const props = pieces[1];
        for (const prop of props.split(";")) {
          if (!prop) {
            continue;
          }
          const keyValue = prop.split("=");
          if (keyValue.length !== 2) {
            continue;
          }
          const [key, value] = keyValue;
          switch (key) {
            case AdbBannerKey.Product:
              product = value;
              break;
            case AdbBannerKey.Model:
              model = value;
              break;
            case AdbBannerKey.Device:
              device = value;
              break;
            case AdbBannerKey.Features:
              features = value.split(",");
              break;
          }
        }
      }
      return new _AdbBanner(state, product, model, device, features);
    }
    get state() {
      return __privateGet(this, _state2);
    }
    get product() {
      return __privateGet(this, _product);
    }
    get model() {
      return __privateGet(this, _model);
    }
    get device() {
      return __privateGet(this, _device);
    }
    get features() {
      return __privateGet(this, _features);
    }
  };
  _state2 = new WeakMap();
  _product = new WeakMap();
  _model = new WeakMap();
  _device = new WeakMap();
  _features = new WeakMap();
  var AdbBanner = _AdbBanner;

  // node_modules/@yume-chan/adb/esm/daemon/crypto.js
  function getBigUint(array, byteOffset, length) {
    let result = 0n;
    for (let j = 0; j < length % 8; j += 1) {
      result = result << 8n | BigInt(array[byteOffset + j]);
    }
    for (let i = byteOffset + length % 8; i < byteOffset + length; i += 8) {
      result <<= 64n;
      const value = getUint64BigEndian(array, i);
      result |= value;
    }
    return result;
  }
  function setBigUint(array, byteOffset, length, value, littleEndian) {
    if (littleEndian) {
      while (value > 0n) {
        setInt64LittleEndian(array, byteOffset, value);
        byteOffset += 8;
        value >>= 64n;
      }
    } else {
      let position = byteOffset + length - 8;
      while (value > 0n) {
        setInt64BigEndian(array, position, value);
        position -= 8;
        value >>= 64n;
      }
    }
  }
  function derHeader(data, offset) {
    offset = offset + 1;
    let length = data[offset];
    offset += 1;
    if (length & 128) {
      const lengthBytes = length & 127;
      length = 0;
      for (let i = 0; i < lengthBytes; i += 1) {
        length = length << 8 | data[offset];
        offset += 1;
      }
    }
    return { offset, length };
  }
  function rsaParsePrivateKey(key) {
    let offset = derHeader(key, 0).offset;
    let header = derHeader(key, offset);
    offset = header.offset + header.length;
    header = derHeader(key, offset);
    offset = header.offset + header.length;
    offset = derHeader(key, offset).offset;
    offset = derHeader(key, offset).offset;
    header = derHeader(key, offset);
    offset = header.offset + header.length;
    const nHeader = derHeader(key, offset);
    offset = nHeader.offset + nHeader.length;
    const eHeader = derHeader(key, offset);
    offset = eHeader.offset + eHeader.length;
    const dHeader = derHeader(key, offset);
    const n = getBigUint(key, nHeader.offset, nHeader.length);
    const d = getBigUint(key, dHeader.offset, dHeader.length);
    return [n, d];
  }
  function nonNegativeMod(m, d) {
    const r = m % d;
    if (r > 0) {
      return r;
    }
    return r + (d > 0 ? d : -d);
  }
  function modInverse(a, m) {
    a = nonNegativeMod(a, m);
    if (!a || m < 2) {
      return NaN;
    }
    const s = [];
    let b = m;
    while (b) {
      [a, b] = [b, a % b];
      s.push({ a, b });
    }
    if (a !== 1) {
      return NaN;
    }
    let x = 1;
    let y = 0;
    for (let i = s.length - 2; i >= 0; i -= 1) {
      [x, y] = [y, x - y * Math.floor(s[i].a / s[i].b)];
    }
    return nonNegativeMod(y, m);
  }
  var ModulusLengthInBytes = 2048 / 8;
  var ModulusLengthInWords = ModulusLengthInBytes / 4;
  function adbGetPublicKeySize() {
    return 4 + 4 + ModulusLengthInBytes + ModulusLengthInBytes + 4;
  }
  function adbGeneratePublicKey(privateKey, output) {
    let outputType;
    const outputLength = adbGetPublicKeySize();
    if (!output) {
      output = new Uint8Array(outputLength);
      outputType = "Uint8Array";
    } else {
      if (output.length < outputLength) {
        throw new TypeError("output buffer is too small");
      }
      outputType = "number";
    }
    const outputView = new DataView(output.buffer, output.byteOffset, output.length);
    let outputOffset = 0;
    outputView.setUint32(outputOffset, ModulusLengthInWords, true);
    outputOffset += 4;
    const [n] = rsaParsePrivateKey(privateKey);
    const n0inv = -modInverse(Number(n % 2n ** 32n), 2 ** 32);
    outputView.setInt32(outputOffset, n0inv, true);
    outputOffset += 4;
    setBigUint(output, outputOffset, ModulusLengthInBytes, n, true);
    outputOffset += ModulusLengthInBytes;
    const rr = 2n ** 4096n % n;
    setBigUint(output, outputOffset, ModulusLengthInBytes, rr, true);
    outputOffset += ModulusLengthInBytes;
    outputView.setUint32(outputOffset, 65537, true);
    if (outputType === "Uint8Array") {
      return output;
    } else {
      return outputLength;
    }
  }
  function powMod(base, exponent, modulus) {
    if (modulus === 1n) {
      return 0n;
    }
    let r = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (BigInt.asUintN(1, exponent) === 1n) {
        r = r * base % modulus;
      }
      base = base * base % modulus;
      exponent >>= 1n;
    }
    return r;
  }
  var SHA1_DIGEST_LENGTH = 20;
  var ASN1_SEQUENCE = 48;
  var ASN1_OCTET_STRING = 4;
  var ASN1_NULL = 5;
  var ASN1_OID = 6;
  var SHA1_DIGEST_INFO = new Uint8Array([
    ASN1_SEQUENCE,
    13 + SHA1_DIGEST_LENGTH,
    ASN1_SEQUENCE,
    9,
    // SHA-1 (1 3 14 3 2 26)
    ASN1_OID,
    5,
    1 * 40 + 3,
    14,
    3,
    2,
    26,
    ASN1_NULL,
    0,
    ASN1_OCTET_STRING,
    SHA1_DIGEST_LENGTH
  ]);
  function rsaSign(privateKey, data) {
    const [n, d] = rsaParsePrivateKey(privateKey);
    const padded = new Uint8Array(256);
    let index = 0;
    padded[index] = 0;
    index += 1;
    padded[index] = 1;
    index += 1;
    const fillLength = padded.length - SHA1_DIGEST_INFO.length - data.length - 1;
    while (index < fillLength) {
      padded[index] = 255;
      index += 1;
    }
    padded[index] = 0;
    index += 1;
    padded.set(SHA1_DIGEST_INFO, index);
    index += SHA1_DIGEST_INFO.length;
    padded.set(data, index);
    const signature = powMod(getBigUint(padded, 0, padded.length), d, n);
    setBigUint(padded, 0, padded.length, signature, false);
    return padded;
  }

  // node_modules/@yume-chan/adb/esm/daemon/packet.js
  var AdbCommand = {
    Auth: 1213486401,
    // 'AUTH'
    Close: 1163086915,
    // 'CLSE'
    Connect: 1314410051,
    // 'CNXN'
    Okay: 1497451343,
    // 'OKAY'
    Open: 1313165391,
    // 'OPEN'
    Write: 1163154007
    // 'WRTE'
  };
  var AdbPacketHeader = struct({
    command: u32,
    arg0: u32,
    arg1: u32,
    payloadLength: u32,
    checksum: u32,
    magic: s32
  }, { littleEndian: true });
  var AdbPacket = extend(AdbPacketHeader, {
    payload: buffer("payloadLength")
  });
  function calculateChecksum(payload) {
    return payload.reduce((result, item) => result + item, 0);
  }
  var AdbPacketSerializeStream = class extends TransformStream {
    constructor() {
      const headerBuffer = new Uint8Array(AdbPacketHeader.size);
      super({
        transform: async (chunk, controller) => {
          await chunk.tryConsume(async (chunk2) => {
            const init2 = chunk2;
            init2.payloadLength = init2.payload.length;
            AdbPacketHeader.serialize(init2, headerBuffer);
            await Consumable.ReadableStream.enqueue(controller, headerBuffer);
            if (init2.payloadLength) {
              await Consumable.ReadableStream.enqueue(controller, init2.payload);
            }
          });
        }
      });
    }
  };

  // node_modules/@yume-chan/adb/esm/daemon/auth.js
  var AdbAuthType = {
    Token: 1,
    Signature: 2,
    PublicKey: 3
  };
  var AdbSignatureAuthenticator = async function* (credentialStore, getNextRequest) {
    for await (const key of credentialStore.iterateKeys()) {
      const packet = await getNextRequest();
      if (packet.arg0 !== AdbAuthType.Token) {
        return;
      }
      const signature = rsaSign(key.buffer, packet.payload);
      yield {
        command: AdbCommand.Auth,
        arg0: AdbAuthType.Signature,
        arg1: 0,
        payload: signature
      };
    }
  };
  var AdbPublicKeyAuthenticator = async function* (credentialStore, getNextRequest) {
    const packet = await getNextRequest();
    if (packet.arg0 !== AdbAuthType.Token) {
      return;
    }
    let privateKey;
    for await (const key of credentialStore.iterateKeys()) {
      privateKey = key;
      break;
    }
    if (!privateKey) {
      privateKey = await credentialStore.generateKey();
    }
    const publicKeyLength = adbGetPublicKeySize();
    const [publicKeyBase64Length] = calculateBase64EncodedLength(publicKeyLength);
    const nameBuffer = privateKey.name?.length ? encodeUtf8(privateKey.name) : EmptyUint8Array;
    const publicKeyBuffer = new Uint8Array(publicKeyBase64Length + (nameBuffer.length ? nameBuffer.length + 1 : 0) + // Space character + name
    1);
    adbGeneratePublicKey(privateKey.buffer, publicKeyBuffer);
    encodeBase64(publicKeyBuffer.subarray(0, publicKeyLength), publicKeyBuffer);
    if (nameBuffer.length) {
      publicKeyBuffer[publicKeyBase64Length] = 32;
      publicKeyBuffer.set(nameBuffer, publicKeyBase64Length + 1);
    }
    yield {
      command: AdbCommand.Auth,
      arg0: AdbAuthType.PublicKey,
      arg1: 0,
      payload: publicKeyBuffer
    };
  };
  var ADB_DEFAULT_AUTHENTICATORS = [
    AdbSignatureAuthenticator,
    AdbPublicKeyAuthenticator
  ];
  var _credentialStore, _pendingRequest, _iterator, _getNextRequest, _AdbAuthenticationProcessor_instances, invokeAuthenticator_fn;
  var AdbAuthenticationProcessor = class {
    constructor(authenticators, credentialStore) {
      __privateAdd(this, _AdbAuthenticationProcessor_instances);
      __publicField(this, "authenticators");
      __privateAdd(this, _credentialStore);
      __privateAdd(this, _pendingRequest, new PromiseResolver());
      __privateAdd(this, _iterator);
      __privateAdd(this, _getNextRequest, () => {
        return __privateGet(this, _pendingRequest).promise;
      });
      this.authenticators = authenticators;
      __privateSet(this, _credentialStore, credentialStore);
    }
    async process(packet) {
      if (!__privateGet(this, _iterator)) {
        __privateSet(this, _iterator, __privateMethod(this, _AdbAuthenticationProcessor_instances, invokeAuthenticator_fn).call(this));
      }
      __privateGet(this, _pendingRequest).resolve(packet);
      const result = await __privateGet(this, _iterator).next();
      if (result.done) {
        throw new Error("No authenticator can handle the request");
      }
      return result.value;
    }
    dispose() {
      void __privateGet(this, _iterator)?.return?.();
    }
  };
  _credentialStore = new WeakMap();
  _pendingRequest = new WeakMap();
  _iterator = new WeakMap();
  _getNextRequest = new WeakMap();
  _AdbAuthenticationProcessor_instances = new WeakSet();
  invokeAuthenticator_fn = async function* () {
    for (const authenticator of this.authenticators) {
      for await (const packet of authenticator(__privateGet(this, _credentialStore), __privateGet(this, _getNextRequest))) {
        __privateSet(this, _pendingRequest, new PromiseResolver());
        yield packet;
      }
    }
  };

  // node_modules/@yume-chan/adb/esm/daemon/socket.js
  var _dispatcher, _readable5, _readableController3, _writableController, _closed2, _closedPromise, _socket6, _availableWriteBytesChanged, _availableWriteBytes, _AdbDaemonSocketController_instances, writeChunk_fn;
  var AdbDaemonSocketController = class {
    constructor(options) {
      __privateAdd(this, _AdbDaemonSocketController_instances);
      __privateAdd(this, _dispatcher);
      __publicField(this, "localId");
      __publicField(this, "remoteId");
      __publicField(this, "localCreated");
      __publicField(this, "service");
      __privateAdd(this, _readable5);
      __privateAdd(this, _readableController3);
      __privateAdd(this, _writableController);
      __publicField(this, "writable");
      __privateAdd(this, _closed2, false);
      __privateAdd(this, _closedPromise, new PromiseResolver());
      __privateAdd(this, _socket6);
      __privateAdd(this, _availableWriteBytesChanged);
      /**
       * When delayed ack is disabled, returns `Infinity` if the socket is ready to write
       * (exactly one packet can be written no matter how large it is), or `-1` if the socket
       * is waiting for ack message.
       *
       * When delayed ack is enabled, returns a non-negative finite number indicates the number of
       * bytes that can be written to the socket before waiting for ack message.
       */
      __privateAdd(this, _availableWriteBytes, 0);
      __privateSet(this, _dispatcher, options.dispatcher);
      this.localId = options.localId;
      this.remoteId = options.remoteId;
      this.localCreated = options.localCreated;
      this.service = options.service;
      __privateSet(this, _readable5, new PushReadableStream((controller) => {
        __privateSet(this, _readableController3, controller);
      }));
      this.writable = new maybe_consumable_exports.WritableStream({
        start: (controller) => {
          __privateSet(this, _writableController, controller);
          controller.signal.addEventListener("abort", () => {
            __privateGet(this, _availableWriteBytesChanged)?.reject(controller.signal.reason);
          });
        },
        write: async (data) => {
          const size = data.length;
          const chunkSize = __privateGet(this, _dispatcher).options.maxPayloadSize;
          for (let start = 0, end = chunkSize; start < size; start = end, end += chunkSize) {
            const chunk = data.subarray(start, end);
            await __privateMethod(this, _AdbDaemonSocketController_instances, writeChunk_fn).call(this, chunk);
          }
        }
      });
      __privateSet(this, _socket6, new AdbDaemonSocket(this));
      __privateSet(this, _availableWriteBytes, options.availableWriteBytes);
    }
    get readable() {
      return __privateGet(this, _readable5);
    }
    get closed() {
      return __privateGet(this, _closedPromise).promise;
    }
    get socket() {
      return __privateGet(this, _socket6);
    }
    async enqueue(data) {
      await __privateGet(this, _readableController3).enqueue(data);
    }
    ack(bytes) {
      __privateSet(this, _availableWriteBytes, __privateGet(this, _availableWriteBytes) + bytes);
      __privateGet(this, _availableWriteBytesChanged)?.resolve();
    }
    async close() {
      if (__privateGet(this, _closed2)) {
        return;
      }
      __privateSet(this, _closed2, true);
      __privateGet(this, _availableWriteBytesChanged)?.reject(new Error("Socket closed"));
      try {
        __privateGet(this, _writableController).error(new Error("Socket closed"));
      } catch {
      }
      await __privateGet(this, _dispatcher).sendPacket(AdbCommand.Close, this.localId, this.remoteId, EmptyUint8Array);
    }
    dispose() {
      __privateGet(this, _readableController3).close();
      __privateGet(this, _closedPromise).resolve(void 0);
    }
  };
  _dispatcher = new WeakMap();
  _readable5 = new WeakMap();
  _readableController3 = new WeakMap();
  _writableController = new WeakMap();
  _closed2 = new WeakMap();
  _closedPromise = new WeakMap();
  _socket6 = new WeakMap();
  _availableWriteBytesChanged = new WeakMap();
  _availableWriteBytes = new WeakMap();
  _AdbDaemonSocketController_instances = new WeakSet();
  writeChunk_fn = async function(data) {
    const length = data.length;
    while (__privateGet(this, _availableWriteBytes) < length) {
      const resolver = new PromiseResolver();
      __privateSet(this, _availableWriteBytesChanged, resolver);
      await resolver.promise;
    }
    if (__privateGet(this, _availableWriteBytes) === Infinity) {
      __privateSet(this, _availableWriteBytes, -1);
    } else {
      __privateSet(this, _availableWriteBytes, __privateGet(this, _availableWriteBytes) - length);
    }
    await __privateGet(this, _dispatcher).sendPacket(AdbCommand.Write, this.localId, this.remoteId, data);
  };
  var _controller;
  var AdbDaemonSocket = class {
    constructor(controller) {
      __privateAdd(this, _controller);
      __privateSet(this, _controller, controller);
    }
    get localId() {
      return __privateGet(this, _controller).localId;
    }
    get remoteId() {
      return __privateGet(this, _controller).remoteId;
    }
    get localCreated() {
      return __privateGet(this, _controller).localCreated;
    }
    get service() {
      return __privateGet(this, _controller).service;
    }
    get readable() {
      return __privateGet(this, _controller).readable;
    }
    get writable() {
      return __privateGet(this, _controller).writable;
    }
    get closed() {
      return __privateGet(this, _controller).closed;
    }
    close() {
      return __privateGet(this, _controller).close();
    }
  };
  _controller = new WeakMap();

  // node_modules/@yume-chan/adb/esm/daemon/dispatcher.js
  var _initializers, _sockets, _writer5, _closed3, _disconnected, _incomingSocketHandlers, _readAbortController, _AdbPacketDispatcher_instances, handleClose_fn, handleOkay_fn, sendOkay_fn, handleOpen_fn, handleWrite_fn, dispose_fn;
  var AdbPacketDispatcher = class {
    constructor(connection, options) {
      __privateAdd(this, _AdbPacketDispatcher_instances);
      // ADB socket id starts from 1
      // (0 means open failed)
      __privateAdd(this, _initializers, new AsyncOperationManager(1));
      /**
       * Socket local ID to the socket controller.
       */
      __privateAdd(this, _sockets, /* @__PURE__ */ new Map());
      __privateAdd(this, _writer5);
      __publicField(this, "options");
      __privateAdd(this, _closed3, false);
      __privateAdd(this, _disconnected, new PromiseResolver());
      __privateAdd(this, _incomingSocketHandlers, /* @__PURE__ */ new Map());
      __privateAdd(this, _readAbortController, new AbortController());
      this.options = options;
      if (this.options.initialDelayedAckBytes < 0) {
        this.options.initialDelayedAckBytes = 0;
      }
      connection.readable.pipeTo(new WritableStream({
        write: async (packet, controller) => {
          switch (packet.command) {
            case AdbCommand.Close:
              await __privateMethod(this, _AdbPacketDispatcher_instances, handleClose_fn).call(this, packet);
              break;
            case AdbCommand.Okay:
              __privateMethod(this, _AdbPacketDispatcher_instances, handleOkay_fn).call(this, packet);
              break;
            case AdbCommand.Open:
              await __privateMethod(this, _AdbPacketDispatcher_instances, handleOpen_fn).call(this, packet);
              break;
            case AdbCommand.Write:
              __privateMethod(this, _AdbPacketDispatcher_instances, handleWrite_fn).call(this, packet).catch((e) => {
                controller.error(e);
              });
              break;
            default:
              throw new Error(`Unknown command: ${packet.command.toString(16)}`);
          }
        }
      }), {
        preventCancel: options.preserveConnection ?? false,
        signal: __privateGet(this, _readAbortController).signal
      }).then(() => {
        __privateMethod(this, _AdbPacketDispatcher_instances, dispose_fn).call(this);
      }, (e) => {
        if (!__privateGet(this, _closed3)) {
          __privateGet(this, _disconnected).reject(e);
        }
        __privateMethod(this, _AdbPacketDispatcher_instances, dispose_fn).call(this);
      });
      __privateSet(this, _writer5, connection.writable.getWriter());
    }
    get disconnected() {
      return __privateGet(this, _disconnected).promise;
    }
    async createSocket(service) {
      if (this.options.appendNullToServiceString) {
        service += "\0";
      }
      const [localId, initializer] = __privateGet(this, _initializers).add();
      await this.sendPacket(AdbCommand.Open, localId, this.options.initialDelayedAckBytes, service);
      const { remoteId, availableWriteBytes } = await initializer;
      const controller = new AdbDaemonSocketController({
        dispatcher: this,
        localId,
        remoteId,
        localCreated: true,
        service,
        availableWriteBytes
      });
      __privateGet(this, _sockets).set(localId, controller);
      return controller.socket;
    }
    addReverseTunnel(service, handler) {
      __privateGet(this, _incomingSocketHandlers).set(service, handler);
    }
    removeReverseTunnel(address) {
      __privateGet(this, _incomingSocketHandlers).delete(address);
    }
    clearReverseTunnels() {
      __privateGet(this, _incomingSocketHandlers).clear();
    }
    async sendPacket(command, arg0, arg1, payload) {
      if (typeof payload === "string") {
        payload = encodeUtf8(payload);
      }
      if (payload.length > this.options.maxPayloadSize) {
        throw new TypeError("payload too large");
      }
      await Consumable.WritableStream.write(__privateGet(this, _writer5), {
        command,
        arg0,
        arg1,
        payload,
        checksum: this.options.calculateChecksum ? calculateChecksum(payload) : 0,
        magic: command ^ 4294967295
      });
    }
    async close() {
      await Promise.all(Array.from(__privateGet(this, _sockets).values(), (socket) => socket.close()));
      __privateSet(this, _closed3, true);
      __privateGet(this, _readAbortController).abort();
      if (this.options.preserveConnection) {
        __privateGet(this, _writer5).releaseLock();
      } else {
        await __privateGet(this, _writer5).close();
      }
    }
  };
  _initializers = new WeakMap();
  _sockets = new WeakMap();
  _writer5 = new WeakMap();
  _closed3 = new WeakMap();
  _disconnected = new WeakMap();
  _incomingSocketHandlers = new WeakMap();
  _readAbortController = new WeakMap();
  _AdbPacketDispatcher_instances = new WeakSet();
  handleClose_fn = async function(packet) {
    if (packet.arg0 === 0 && __privateGet(this, _initializers).reject(packet.arg1, new Error("Socket open failed"))) {
      return;
    }
    const socket = __privateGet(this, _sockets).get(packet.arg1);
    if (socket) {
      await socket.close();
      socket.dispose();
      __privateGet(this, _sockets).delete(packet.arg1);
      return;
    }
  };
  handleOkay_fn = function(packet) {
    let ackBytes;
    if (this.options.initialDelayedAckBytes !== 0) {
      if (packet.payload.length !== 4) {
        throw new Error("Invalid OKAY packet. Payload size should be 4");
      }
      ackBytes = getUint32LittleEndian(packet.payload, 0);
    } else {
      if (packet.payload.length !== 0) {
        throw new Error("Invalid OKAY packet. Payload size should be 0");
      }
      ackBytes = Infinity;
    }
    if (__privateGet(this, _initializers).resolve(packet.arg1, {
      remoteId: packet.arg0,
      availableWriteBytes: ackBytes
    })) {
      return;
    }
    const socket = __privateGet(this, _sockets).get(packet.arg1);
    if (socket) {
      socket.ack(ackBytes);
      return;
    }
    void this.sendPacket(AdbCommand.Close, packet.arg1, packet.arg0, EmptyUint8Array);
  };
  sendOkay_fn = function(localId, remoteId, ackBytes) {
    let payload;
    if (this.options.initialDelayedAckBytes !== 0) {
      payload = new Uint8Array(4);
      setUint32LittleEndian(payload, 0, ackBytes);
    } else {
      payload = EmptyUint8Array;
    }
    return this.sendPacket(AdbCommand.Okay, localId, remoteId, payload);
  };
  handleOpen_fn = async function(packet) {
    const [localId] = __privateGet(this, _initializers).add();
    __privateGet(this, _initializers).resolve(localId, void 0);
    const remoteId = packet.arg0;
    let availableWriteBytes = packet.arg1;
    let service = decodeUtf8(packet.payload);
    if (service.endsWith("\0")) {
      service = service.substring(0, service.length - 1);
    }
    if (this.options.initialDelayedAckBytes === 0) {
      if (availableWriteBytes !== 0) {
        throw new Error("Invalid OPEN packet. arg1 should be 0");
      }
      availableWriteBytes = Infinity;
    } else {
      if (availableWriteBytes === 0) {
        throw new Error("Invalid OPEN packet. arg1 should be greater than 0");
      }
    }
    const handler = __privateGet(this, _incomingSocketHandlers).get(service);
    if (!handler) {
      await this.sendPacket(AdbCommand.Close, 0, remoteId, EmptyUint8Array);
      return;
    }
    const controller = new AdbDaemonSocketController({
      dispatcher: this,
      localId,
      remoteId,
      localCreated: false,
      service,
      availableWriteBytes
    });
    try {
      await handler(controller.socket);
      __privateGet(this, _sockets).set(localId, controller);
      await __privateMethod(this, _AdbPacketDispatcher_instances, sendOkay_fn).call(this, localId, remoteId, this.options.initialDelayedAckBytes);
    } catch {
      await this.sendPacket(AdbCommand.Close, 0, remoteId, EmptyUint8Array);
    }
  };
  handleWrite_fn = async function(packet) {
    const socket = __privateGet(this, _sockets).get(packet.arg1);
    if (!socket) {
      throw new Error(`Unknown local socket id: ${packet.arg1}`);
    }
    let handled = false;
    const promises = [
      (async () => {
        await socket.enqueue(packet.payload);
        await __privateMethod(this, _AdbPacketDispatcher_instances, sendOkay_fn).call(this, packet.arg1, packet.arg0, packet.payload.length);
        handled = true;
      })()
    ];
    if (this.options.readTimeLimit) {
      promises.push((async () => {
        await delay(this.options.readTimeLimit);
        if (!handled) {
          throw new Error(`readable of \`${socket.service}\` has stalled for ${this.options.readTimeLimit} milliseconds`);
        }
      })());
    }
    await Promise.race(promises);
  };
  dispose_fn = function() {
    for (const socket of __privateGet(this, _sockets).values()) {
      socket.dispose();
    }
    __privateGet(this, _disconnected).resolve();
  };

  // node_modules/@yume-chan/adb/esm/daemon/transport.js
  var ADB_DAEMON_VERSION_OMIT_CHECKSUM = 16777217;
  var ADB_DAEMON_DEFAULT_FEATURES = /* @__PURE__ */ (() => [
    AdbFeature.ShellV2,
    AdbFeature.Cmd,
    AdbFeature.StatV2,
    AdbFeature.ListV2,
    AdbFeature.FixedPushMkdir,
    "apex",
    AdbFeature.Abb,
    // only tells the client the symlink timestamp issue in `adb push --sync` has been fixed.
    // No special handling required.
    "fixed_push_symlink_timestamp",
    AdbFeature.AbbExec,
    "remount_shell",
    "track_app",
    AdbFeature.SendReceiveV2,
    "sendrecv_v2_brotli",
    "sendrecv_v2_lz4",
    "sendrecv_v2_zstd",
    "sendrecv_v2_dry_run_send",
    AdbFeature.DelayedAck
  ])();
  var ADB_DAEMON_DEFAULT_INITIAL_PAYLOAD_SIZE = 32 * 1024 * 1024;
  var _connection, _dispatcher2, _serial, _protocolVersion, _banner, _clientFeatures;
  var _AdbDaemonTransport = class _AdbDaemonTransport {
    constructor({ serial, connection, version, banner, features = ADB_DAEMON_DEFAULT_FEATURES, initialDelayedAckBytes, ...options }) {
      __privateAdd(this, _connection);
      __privateAdd(this, _dispatcher2);
      __privateAdd(this, _serial);
      __privateAdd(this, _protocolVersion);
      __privateAdd(this, _banner);
      __privateAdd(this, _clientFeatures);
      __privateSet(this, _serial, serial);
      __privateSet(this, _connection, connection);
      __privateSet(this, _banner, AdbBanner.parse(banner));
      __privateSet(this, _clientFeatures, features);
      if (features.includes(AdbFeature.DelayedAck)) {
        if (initialDelayedAckBytes <= 0) {
          throw new TypeError("`initialDelayedAckBytes` must be greater than 0 when DelayedAck feature is enabled.");
        }
        if (!__privateGet(this, _banner).features.includes(AdbFeature.DelayedAck)) {
          initialDelayedAckBytes = 0;
        }
      } else {
        initialDelayedAckBytes = 0;
      }
      let calculateChecksum2;
      let appendNullToServiceString;
      if (version >= ADB_DAEMON_VERSION_OMIT_CHECKSUM) {
        calculateChecksum2 = false;
        appendNullToServiceString = false;
      } else {
        calculateChecksum2 = true;
        appendNullToServiceString = true;
      }
      __privateSet(this, _dispatcher2, new AdbPacketDispatcher(connection, {
        calculateChecksum: calculateChecksum2,
        appendNullToServiceString,
        initialDelayedAckBytes,
        ...options
      }));
      __privateSet(this, _protocolVersion, version);
    }
    /**
     * Authenticate with the ADB Daemon and create a new transport.
     */
    static async authenticate({ serial, connection, credentialStore, authenticators = ADB_DEFAULT_AUTHENTICATORS, features = ADB_DAEMON_DEFAULT_FEATURES, initialDelayedAckBytes = ADB_DAEMON_DEFAULT_INITIAL_PAYLOAD_SIZE, ...options }) {
      let version = 16777217;
      let maxPayloadSize = 1024 * 1024;
      const resolver = new PromiseResolver();
      const authProcessor = new AdbAuthenticationProcessor(authenticators, credentialStore);
      const abortController = new AbortController();
      const pipe = connection.readable.pipeTo(new WritableStream({
        async write(packet) {
          switch (packet.command) {
            case AdbCommand.Connect:
              version = Math.min(version, packet.arg0);
              maxPayloadSize = Math.min(maxPayloadSize, packet.arg1);
              resolver.resolve(decodeUtf8(packet.payload));
              break;
            case AdbCommand.Auth: {
              const response = await authProcessor.process(packet);
              await sendPacket(response);
              break;
            }
            default:
              break;
          }
        }
      }), {
        // Don't cancel the source ReadableStream on AbortSignal abort.
        preventCancel: true,
        signal: abortController.signal
      }).then(() => {
        resolver.reject(new Error("Connection closed unexpectedly"));
      }, (e) => {
        resolver.reject(e);
      });
      const writer = connection.writable.getWriter();
      async function sendPacket(init2) {
        init2.checksum = calculateChecksum(init2.payload);
        init2.magic = init2.command ^ 4294967295;
        await Consumable.WritableStream.write(writer, init2);
      }
      const actualFeatures = features.slice();
      if (initialDelayedAckBytes <= 0) {
        const index = features.indexOf(AdbFeature.DelayedAck);
        if (index !== -1) {
          actualFeatures.splice(index, 1);
        }
      }
      let banner;
      try {
        await sendPacket({
          command: AdbCommand.Connect,
          arg0: version,
          arg1: maxPayloadSize,
          // The terminating `;` is required in formal definition
          // But ADB daemon (all versions) can still work without it
          payload: encodeUtf8(`host::features=${actualFeatures.join(",")}`)
        });
        banner = await resolver.promise;
      } finally {
        abortController.abort();
        writer.releaseLock();
        await pipe;
      }
      return new _AdbDaemonTransport({
        serial,
        connection,
        version,
        maxPayloadSize,
        banner,
        features: actualFeatures,
        initialDelayedAckBytes,
        ...options
      });
    }
    get connection() {
      return __privateGet(this, _connection);
    }
    get serial() {
      return __privateGet(this, _serial);
    }
    get protocolVersion() {
      return __privateGet(this, _protocolVersion);
    }
    get maxPayloadSize() {
      return __privateGet(this, _dispatcher2).options.maxPayloadSize;
    }
    get banner() {
      return __privateGet(this, _banner);
    }
    get disconnected() {
      return __privateGet(this, _dispatcher2).disconnected;
    }
    get clientFeatures() {
      return __privateGet(this, _clientFeatures);
    }
    connect(service) {
      return __privateGet(this, _dispatcher2).createSocket(service);
    }
    addReverseTunnel(handler, address) {
      if (!address) {
        const id = Math.random().toString().substring(2);
        address = `localabstract:reverse_${id}`;
      }
      __privateGet(this, _dispatcher2).addReverseTunnel(address, handler);
      return address;
    }
    removeReverseTunnel(address) {
      __privateGet(this, _dispatcher2).removeReverseTunnel(address);
    }
    clearReverseTunnels() {
      __privateGet(this, _dispatcher2).clearReverseTunnels();
    }
    close() {
      return __privateGet(this, _dispatcher2).close();
    }
  };
  _connection = new WeakMap();
  _dispatcher2 = new WeakMap();
  _serial = new WeakMap();
  _protocolVersion = new WeakMap();
  _banner = new WeakMap();
  _clientFeatures = new WeakMap();
  var AdbDaemonTransport = _AdbDaemonTransport;

  // node_modules/@yume-chan/adb/esm/server/observer.js
  function unorderedRemove(array, index) {
    if (index < 0 || index >= array.length) {
      return;
    }
    array[index] = array[array.length - 1];
    array.length -= 1;
  }

  // node_modules/@yume-chan/adb-daemon-webusb/esm/error.js
  var DeviceBusyError = class extends Error {
    constructor(cause) {
      super("The device is already in used by another program", {
        cause
      });
    }
  };

  // node_modules/@yume-chan/adb-daemon-webusb/esm/utils.js
  function isErrorName(e, name) {
    return typeof e === "object" && e !== null && "name" in e && e.name === name;
  }
  function isUsbInterfaceFilter(filter) {
    return filter.classCode !== void 0 && filter.subclassCode !== void 0 && filter.protocolCode !== void 0;
  }
  function matchUsbInterfaceFilter(alternate, filter) {
    return alternate.interfaceClass === filter.classCode && alternate.interfaceSubclass === filter.subclassCode && alternate.interfaceProtocol === filter.protocolCode;
  }
  function findUsbInterface(device, filter) {
    for (const configuration of device.configurations) {
      for (const interface_ of configuration.interfaces) {
        for (const alternate of interface_.alternates) {
          if (matchUsbInterfaceFilter(alternate, filter)) {
            return { configuration, interface_, alternate };
          }
        }
      }
    }
    return void 0;
  }
  function padNumber(value) {
    return value.toString(16).padStart(4, "0");
  }
  function getSerialNumber(device) {
    if (device.serialNumber) {
      return device.serialNumber;
    }
    return padNumber(device.vendorId) + "x" + padNumber(device.productId);
  }
  function findUsbEndpoints(endpoints) {
    if (endpoints.length === 0) {
      throw new TypeError("No endpoints given");
    }
    let inEndpoint;
    let outEndpoint;
    for (const endpoint of endpoints) {
      switch (endpoint.direction) {
        case "in":
          inEndpoint = endpoint;
          if (outEndpoint) {
            return { inEndpoint, outEndpoint };
          }
          break;
        case "out":
          outEndpoint = endpoint;
          if (inEndpoint) {
            return { inEndpoint, outEndpoint };
          }
          break;
      }
    }
    if (!inEndpoint) {
      throw new TypeError("No input endpoint found.");
    }
    if (!outEndpoint) {
      throw new TypeError("No output endpoint found.");
    }
    throw new Error("unreachable");
  }
  function matchFilter(device, filter) {
    if (filter.vendorId !== void 0 && device.vendorId !== filter.vendorId) {
      return false;
    }
    if (filter.productId !== void 0 && device.productId !== filter.productId) {
      return false;
    }
    if (filter.serialNumber !== void 0 && getSerialNumber(device) !== filter.serialNumber) {
      return false;
    }
    if (isUsbInterfaceFilter(filter)) {
      return findUsbInterface(device, filter) || false;
    }
    return true;
  }
  function matchFilters(device, filters, exclusionFilters) {
    if (exclusionFilters && exclusionFilters.length > 0) {
      if (matchFilters(device, exclusionFilters)) {
        return false;
      }
    }
    for (const filter of filters) {
      const result = matchFilter(device, filter);
      if (result) {
        return result;
      }
    }
    return false;
  }

  // node_modules/@yume-chan/adb-daemon-webusb/esm/device.js
  var AdbDefaultInterfaceFilter = {
    classCode: 255,
    subclassCode: 66,
    protocolCode: 1
  };
  function mergeDefaultAdbInterfaceFilter(filters) {
    if (!filters || filters.length === 0) {
      return [AdbDefaultInterfaceFilter];
    } else {
      return filters.map((filter) => ({
        ...filter,
        classCode: filter.classCode ?? AdbDefaultInterfaceFilter.classCode,
        subclassCode: filter.subclassCode ?? AdbDefaultInterfaceFilter.subclassCode,
        protocolCode: filter.protocolCode ?? AdbDefaultInterfaceFilter.protocolCode
      }));
    }
  }
  var _device2, _inEndpoint, _outEndpoint, _readable6, _writable4, _AdbDaemonWebUsbConnection_instances, transferIn_fn;
  var AdbDaemonWebUsbConnection = class {
    constructor(device, inEndpoint, outEndpoint, usbManager) {
      __privateAdd(this, _AdbDaemonWebUsbConnection_instances);
      __privateAdd(this, _device2);
      __privateAdd(this, _inEndpoint);
      __privateAdd(this, _outEndpoint);
      __privateAdd(this, _readable6);
      __privateAdd(this, _writable4);
      __privateSet(this, _device2, device);
      __privateSet(this, _inEndpoint, inEndpoint);
      __privateSet(this, _outEndpoint, outEndpoint);
      let closed2 = false;
      const duplex = new DuplexStreamFactory({
        close: async () => {
          try {
            closed2 = true;
            await device.raw.close();
          } catch {
          }
        },
        dispose: () => {
          closed2 = true;
          usbManager.removeEventListener("disconnect", handleUsbDisconnect);
        }
      });
      function handleUsbDisconnect(e) {
        if (e.device === device.raw) {
          duplex.dispose().catch(unreachable);
        }
      }
      usbManager.addEventListener("disconnect", handleUsbDisconnect);
      __privateSet(this, _readable6, duplex.wrapReadable(new ReadableStream({
        pull: async (controller) => {
          const packet = await __privateMethod(this, _AdbDaemonWebUsbConnection_instances, transferIn_fn).call(this);
          if (packet) {
            controller.enqueue(packet);
          } else {
            controller.close();
          }
        }
      }, { highWaterMark: 0 })));
      const zeroMask = outEndpoint.packetSize - 1;
      __privateSet(this, _writable4, pipeFrom(duplex.createWritable(new maybe_consumable_exports.WritableStream({
        write: async (chunk) => {
          try {
            await device.raw.transferOut(outEndpoint.endpointNumber, toLocalUint8Array(chunk));
            if (zeroMask && (chunk.length & zeroMask) === 0) {
              await device.raw.transferOut(outEndpoint.endpointNumber, EmptyUint8Array);
            }
          } catch (e) {
            if (closed2) {
              return;
            }
            throw e;
          }
        }
      })), new AdbPacketSerializeStream()));
    }
    get device() {
      return __privateGet(this, _device2);
    }
    get inEndpoint() {
      return __privateGet(this, _inEndpoint);
    }
    get outEndpoint() {
      return __privateGet(this, _outEndpoint);
    }
    get readable() {
      return __privateGet(this, _readable6);
    }
    get writable() {
      return __privateGet(this, _writable4);
    }
  };
  _device2 = new WeakMap();
  _inEndpoint = new WeakMap();
  _outEndpoint = new WeakMap();
  _readable6 = new WeakMap();
  _writable4 = new WeakMap();
  _AdbDaemonWebUsbConnection_instances = new WeakSet();
  transferIn_fn = async function() {
    try {
      while (true) {
        const result = await __privateGet(this, _device2).raw.transferIn(__privateGet(this, _inEndpoint).endpointNumber, __privateGet(this, _inEndpoint).packetSize);
        if (result.data.byteLength !== 24) {
          continue;
        }
        const buffer2 = new Uint8Array(result.data.buffer);
        const stream = new Uint8ArrayExactReadable(buffer2);
        const packet = AdbPacketHeader.deserialize(stream);
        if (packet.magic !== (packet.command ^ 4294967295)) {
          continue;
        }
        if (packet.payloadLength !== 0) {
          const result2 = await __privateGet(this, _device2).raw.transferIn(__privateGet(this, _inEndpoint).endpointNumber, packet.payloadLength);
          packet.payload = new Uint8Array(result2.data.buffer);
        } else {
          packet.payload = EmptyUint8Array;
        }
        return packet;
      }
    } catch (e) {
      if (isErrorName(e, "NetworkError")) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
        if (closed) {
          return void 0;
        }
      }
      throw e;
    }
  };
  var _interface, _usbManager, _raw, _serial2, _AdbDaemonWebUsbDevice_instances, claimInterface_fn;
  var _AdbDaemonWebUsbDevice = class _AdbDaemonWebUsbDevice {
    /**
     * Create a new instance of `AdbDaemonWebUsbConnection` using a specified `USBDevice` instance
     *
     * @param device The `USBDevice` instance obtained elsewhere.
     * @param filters The filters to use when searching for ADB interface. Defaults to {@link ADB_DEFAULT_DEVICE_FILTER}.
     */
    constructor(device, interface_, usbManager) {
      __privateAdd(this, _AdbDaemonWebUsbDevice_instances);
      __privateAdd(this, _interface);
      __privateAdd(this, _usbManager);
      __privateAdd(this, _raw);
      __privateAdd(this, _serial2);
      __privateSet(this, _raw, device);
      __privateSet(this, _serial2, getSerialNumber(device));
      __privateSet(this, _interface, interface_);
      __privateSet(this, _usbManager, usbManager);
    }
    get raw() {
      return __privateGet(this, _raw);
    }
    get serial() {
      return __privateGet(this, _serial2);
    }
    get name() {
      return __privateGet(this, _raw).productName;
    }
    /**
     * Open the device and create a new connection to the ADB Daemon.
     */
    async connect() {
      const { inEndpoint, outEndpoint } = await __privateMethod(this, _AdbDaemonWebUsbDevice_instances, claimInterface_fn).call(this);
      return new AdbDaemonWebUsbConnection(this, inEndpoint, outEndpoint, __privateGet(this, _usbManager));
    }
  };
  _interface = new WeakMap();
  _usbManager = new WeakMap();
  _raw = new WeakMap();
  _serial2 = new WeakMap();
  _AdbDaemonWebUsbDevice_instances = new WeakSet();
  claimInterface_fn = async function() {
    if (!__privateGet(this, _raw).opened) {
      await __privateGet(this, _raw).open();
    }
    const { configuration, interface_, alternate } = __privateGet(this, _interface);
    if (__privateGet(this, _raw).configuration?.configurationValue !== configuration.configurationValue) {
      await __privateGet(this, _raw).selectConfiguration(configuration.configurationValue);
    }
    if (!interface_.claimed) {
      try {
        await __privateGet(this, _raw).claimInterface(interface_.interfaceNumber);
      } catch (e) {
        if (isErrorName(e, "NetworkError")) {
          throw new _AdbDaemonWebUsbDevice.DeviceBusyError(e);
        }
        throw e;
      }
    }
    if (interface_.alternate.alternateSetting !== alternate.alternateSetting) {
      await __privateGet(this, _raw).selectAlternateInterface(interface_.interfaceNumber, alternate.alternateSetting);
    }
    return findUsbEndpoints(alternate.endpoints);
  };
  __publicField(_AdbDaemonWebUsbDevice, "DeviceBusyError", DeviceBusyError);
  var AdbDaemonWebUsbDevice = _AdbDaemonWebUsbDevice;

  // node_modules/@yume-chan/adb-daemon-webusb/esm/observer.js
  var _filters, _exclusionFilters, _usbManager2, _onDeviceAdd, _onDeviceRemove, _onListChange, _AdbDaemonWebUsbDeviceObserver_instances, convertDevice_fn, _handleConnect, _handleDisconnect;
  var _AdbDaemonWebUsbDeviceObserver = class _AdbDaemonWebUsbDeviceObserver {
    constructor(usb, initial, options = {}) {
      __privateAdd(this, _AdbDaemonWebUsbDeviceObserver_instances);
      __privateAdd(this, _filters);
      __privateAdd(this, _exclusionFilters);
      __privateAdd(this, _usbManager2);
      __privateAdd(this, _onDeviceAdd, new EventEmitter());
      __publicField(this, "onDeviceAdd", __privateGet(this, _onDeviceAdd).event);
      __privateAdd(this, _onDeviceRemove, new EventEmitter());
      __publicField(this, "onDeviceRemove", __privateGet(this, _onDeviceRemove).event);
      __privateAdd(this, _onListChange, new StickyEventEmitter());
      __publicField(this, "onListChange", __privateGet(this, _onListChange).event);
      __publicField(this, "current", []);
      __privateAdd(this, _handleConnect, (e) => {
        const device = __privateMethod(this, _AdbDaemonWebUsbDeviceObserver_instances, convertDevice_fn).call(this, e.device);
        if (!device) {
          return;
        }
        if (this.current.some((item) => item.raw === device.raw)) {
          return;
        }
        const next = this.current.slice();
        next.push(device);
        this.current = next;
        __privateGet(this, _onDeviceAdd).fire([device]);
        __privateGet(this, _onListChange).fire(this.current);
      });
      __privateAdd(this, _handleDisconnect, (e) => {
        const index = this.current.findIndex((device) => device.raw === e.device);
        if (index !== -1) {
          const device = this.current[index];
          const next = this.current.slice();
          unorderedRemove(next, index);
          this.current = next;
          __privateGet(this, _onDeviceRemove).fire([device]);
          __privateGet(this, _onListChange).fire(this.current);
        }
      });
      __privateSet(this, _filters, mergeDefaultAdbInterfaceFilter(options.filters));
      __privateSet(this, _exclusionFilters, options.exclusionFilters);
      __privateSet(this, _usbManager2, usb);
      this.current = initial.map((device) => __privateMethod(this, _AdbDaemonWebUsbDeviceObserver_instances, convertDevice_fn).call(this, device)).filter((device) => !!device);
      __privateGet(this, _onListChange).fire(this.current);
      __privateGet(this, _usbManager2).addEventListener("connect", __privateGet(this, _handleConnect));
      __privateGet(this, _usbManager2).addEventListener("disconnect", __privateGet(this, _handleDisconnect));
    }
    static async create(usb, options = {}) {
      const devices = await usb.getDevices();
      return new _AdbDaemonWebUsbDeviceObserver(usb, devices, options);
    }
    stop() {
      __privateGet(this, _usbManager2).removeEventListener("connect", __privateGet(this, _handleConnect));
      __privateGet(this, _usbManager2).removeEventListener("disconnect", __privateGet(this, _handleDisconnect));
      __privateGet(this, _onDeviceAdd).dispose();
      __privateGet(this, _onDeviceRemove).dispose();
      __privateGet(this, _onListChange).dispose();
    }
  };
  _filters = new WeakMap();
  _exclusionFilters = new WeakMap();
  _usbManager2 = new WeakMap();
  _onDeviceAdd = new WeakMap();
  _onDeviceRemove = new WeakMap();
  _onListChange = new WeakMap();
  _AdbDaemonWebUsbDeviceObserver_instances = new WeakSet();
  convertDevice_fn = function(device) {
    const interface_ = matchFilters(device, __privateGet(this, _filters), __privateGet(this, _exclusionFilters));
    if (!interface_) {
      return void 0;
    }
    return new AdbDaemonWebUsbDevice(device, interface_, __privateGet(this, _usbManager2));
  };
  _handleConnect = new WeakMap();
  _handleDisconnect = new WeakMap();
  var AdbDaemonWebUsbDeviceObserver = _AdbDaemonWebUsbDeviceObserver;

  // node_modules/@yume-chan/adb-daemon-webusb/esm/manager.js
  var _usbManager3;
  var _AdbDaemonWebUsbDeviceManager = class _AdbDaemonWebUsbDeviceManager {
    /**
     * Create a new instance of {@link AdbDaemonWebUsbDeviceManager} using the specified WebUSB implementation.
     * @param usbManager A WebUSB compatible interface.
     */
    constructor(usbManager) {
      __privateAdd(this, _usbManager3);
      __privateSet(this, _usbManager3, usbManager);
    }
    /**
     * Call `USB#requestDevice()` to prompt the user to select a device.
     */
    async requestDevice(options = {}) {
      const filters = mergeDefaultAdbInterfaceFilter(options.filters);
      try {
        const device = await __privateGet(this, _usbManager3).requestDevice({
          filters,
          exclusionFilters: options.exclusionFilters
        });
        const interface_ = matchFilters(device, filters, options.exclusionFilters);
        if (!interface_) {
          return void 0;
        }
        __privateGet(this, _usbManager3).dispatchEvent(new USBConnectionEvent("connect", { device }));
        return new AdbDaemonWebUsbDevice(device, interface_, __privateGet(this, _usbManager3));
      } catch (e) {
        if (isErrorName(e, "NotFoundError")) {
          return void 0;
        }
        throw e;
      }
    }
    /**
     * Get all connected and requested devices that match the specified filters.
     */
    async getDevices(options = {}) {
      const filters = mergeDefaultAdbInterfaceFilter(options.filters);
      const devices = await __privateGet(this, _usbManager3).getDevices();
      const result = [];
      for (const device of devices) {
        const interface_ = matchFilters(device, filters, options.exclusionFilters);
        if (interface_) {
          result.push(new AdbDaemonWebUsbDevice(device, interface_, __privateGet(this, _usbManager3)));
        }
      }
      return result;
    }
    trackDevices(options = {}) {
      return AdbDaemonWebUsbDeviceObserver.create(__privateGet(this, _usbManager3), options);
    }
  };
  _usbManager3 = new WeakMap();
  /**
   * Gets the instance of {@link AdbDaemonWebUsbDeviceManager} using browser WebUSB implementation.
   *
   * May be `undefined` if current runtime does not support WebUSB.
   */
  __publicField(_AdbDaemonWebUsbDeviceManager, "BROWSER", /* @__PURE__ */ (() => typeof globalThis.navigator !== "undefined" && globalThis.navigator.usb ? new _AdbDaemonWebUsbDeviceManager(globalThis.navigator.usb) : void 0)());
  var AdbDaemonWebUsbDeviceManager = _AdbDaemonWebUsbDeviceManager;

  // node_modules/@yume-chan/adb-credential-web/esm/index.js
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("Tango", 1);
      request.onerror = () => {
        reject(request.error);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("Authentication", { autoIncrement: true });
      };
      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };
    });
  }
  async function saveKey(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("Authentication", "readwrite");
      const store = transaction.objectStore("Authentication");
      const putRequest = store.add(key);
      putRequest.onerror = () => {
        reject(putRequest.error);
      };
      putRequest.onsuccess = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error);
      };
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  async function getAllKeys() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("Authentication", "readonly");
      const store = transaction.objectStore("Authentication");
      const getRequest = store.getAll();
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };
      transaction.onerror = () => {
        reject(transaction.error);
      };
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  var _appName;
  var AdbWebCredentialStore = class {
    constructor(appName = "Tango") {
      __privateAdd(this, _appName);
      __privateSet(this, _appName, appName);
    }
    /**
     * Generates a RSA private key and store it into LocalStorage.
     *
     * Calling this method multiple times will overwrite the previous key.
     *
     * @returns The private key in PKCS #8 format.
     */
    async generateKey() {
      const { privateKey: cryptoKey } = await crypto.subtle.generateKey({
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        // 65537
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-1"
      }, true, ["sign", "verify"]);
      const privateKey = new Uint8Array(await crypto.subtle.exportKey("pkcs8", cryptoKey));
      await saveKey(privateKey);
      return {
        buffer: privateKey,
        name: `${__privateGet(this, _appName)}@${globalThis.location.hostname}`
      };
    }
    /**
     * Yields the stored RSA private key.
     *
     * This method returns a generator, so `for await...of...` loop should be used to read the key.
     */
    async *iterateKeys() {
      for (const key of await getAllKeys()) {
        yield {
          buffer: key,
          name: `${__privateGet(this, _appName)}@${globalThis.location.hostname}`
        };
      }
    }
  };
  _appName = new WeakMap();

  // src/main.js
  var $ = (id) => document.getElementById(id);
  var term = $("term");
  function log(text, cls) {
    const s = document.createElement("span");
    s.className = "ln" + (cls ? " " + cls : "");
    s.textContent = text;
    term.appendChild(s);
    term.scrollTop = term.scrollHeight;
  }
  function stamp() {
    return "[" + (/* @__PURE__ */ new Date()).toTimeString().slice(0, 8) + "] ";
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  var adb = null;
  var Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  function conectadoUI(on) {
    const pill = $("statusPill");
    const txt = $("statusTxt");
    const label = $("connLabel");
    if (on) {
      pill.classList.add("on");
      txt.textContent = "Conectado";
      label.textContent = "Desconectar";
    } else {
      pill.classList.remove("on");
      txt.textContent = "Desconectado";
      label.textContent = "Conectar al auto";
    }
  }
  async function shell(cmd) {
    return await adb.subprocess.noneProtocol.spawnWaitText(cmd);
  }
  async function pushArchivo(bytes, rutaRemota, permiso = 420) {
    const sync = await adb.sync();
    try {
      await sync.write({ filename: rutaRemota, file: new Blob([bytes]).stream(), permission: permiso });
    } finally {
      await sync.dispose();
    }
  }
  async function instalarApk(bytes, nombre) {
    const tmp = "/data/local/tmp/" + nombre;
    log(stamp() + "Enviando " + nombre + " (" + (bytes.length / 1048576).toFixed(1) + " MB)\u2026", "mut");
    await pushArchivo(bytes, tmp);
    log(stamp() + "Instalando\u2026 (puede tardar unos segundos)", "mut");
    const out = (await shell('pm install -r -t -g --force-queryable "' + tmp + '"')).trim();
    await shell('rm -f "' + tmp + '"');
    if (/Success/i.test(out)) {
      log(stamp() + "Instalado \u2713", "ok");
      return true;
    }
    log(stamp() + "No se pudo instalar: " + (out || "(sin mensaje)"), "wn");
    return false;
  }
  async function darPermisos(pkg) {
    log(stamp() + "Dando permisos a " + pkg + "\u2026", "mut");
    let dump = "";
    try {
      dump = await shell("dumpsys package " + pkg);
    } catch (e) {
    }
    const seccion = dump.split(/requested permissions:/i)[1] || "";
    const corte = seccion.split(/install permissions:/i)[0] || seccion;
    const perms = Array.from(new Set(corte.match(/[A-Za-z0-9_.]+\.permission\.[A-Z0-9_]+/g) || []));
    let n = 0;
    for (const p of perms) {
      try {
        await shell("pm grant " + pkg + " " + p);
        n++;
      } catch (e) {
      }
    }
    log("        permisos otorgados: " + n, "acc");
    const appops = [
      "SYSTEM_ALERT_WINDOW",
      "REQUEST_INSTALL_PACKAGES",
      "MANAGE_EXTERNAL_STORAGE",
      "WRITE_SETTINGS",
      "RUN_IN_BACKGROUND",
      "RUN_ANY_IN_BACKGROUND"
    ];
    for (const o of appops) {
      try {
        await shell("appops set " + pkg + " " + o + " allow");
      } catch (e) {
      }
    }
    try {
      await shell("dumpsys deviceidle whitelist +" + pkg);
    } catch (e) {
    }
    log(stamp() + "Permisos listos para " + pkg + " \u2713", "ok");
  }
  async function conectar() {
    if (adb) {
      try {
        await adb.close();
      } catch (e) {
      }
      adb = null;
      conectadoUI(false);
      log(stamp() + "Desconectado.", "mut");
      return;
    }
    if (!Manager) {
      log(stamp() + "En iPhone/iPad no se puede conectar por USB: Apple no lo permite en ningun navegador del iPhone. Abri T1 Puente en una PC o Mac con Chrome o Edge.", "wn");
      return;
    }
    try {
      log(stamp() + "Eleg\xED el dispositivo en el cartel del navegador\u2026", "mut");
      const device = await Manager.requestDevice();
      if (!device) {
        log(stamp() + "No se eligi\xF3 ning\xFAn dispositivo.", "wn");
        return;
      }
      log(stamp() + "Conectando a " + device.serial + "\u2026", "mut");
      const connection = await device.connect();
      const credentialStore = new AdbWebCredentialStore("T1 Puente");
      log(stamp() + "Si lo pide, autoriz\xE1 la depuraci\xF3n USB en la pantalla\u2026", "mut");
      const transport = await AdbDaemonTransport.authenticate({ serial: device.serial, connection, credentialStore });
      adb = new Adb(transport);
      conectadoUI(true);
      const model = (await shell("getprop ro.product.model")).trim();
      const android = (await shell("getprop ro.build.version.release")).trim();
      log(stamp() + "Conectado \u2713  " + model + " \xB7 Android " + android, "ok");
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  function exigirConexion() {
    if (!adb) {
      log(stamp() + "Conect\xE1 el auto primero.", "wn");
      return false;
    }
    return true;
  }
  async function ejecutar() {
    const inp = $("cmd");
    const v = (inp.value || "").trim();
    if (!v) return;
    if (!exigirConexion()) return;
    log("> " + v, "acc");
    inp.value = "";
    try {
      log((await shell(v)).replace(/\s+$/, "") || "(sin salida)", "");
    } catch (e) {
      log("Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function instalarDesdeArchivo(file) {
    if (!exigirConexion()) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await instalarApk(bytes, file.name.replace(/[^A-Za-z0-9._-]/g, "_"));
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function enviarArchivoAuto(file, carpeta) {
    if (!exigirConexion()) return;
    try {
      const nombre = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const ruta = carpeta.replace(/\/+$/, "") + "/" + nombre;
      const bytes = new Uint8Array(await file.arrayBuffer());
      log(stamp() + "Enviando " + nombre + " (" + (bytes.length / 1048576).toFixed(1) + " MB) a " + carpeta + "…", "mut");
      await pushArchivo(bytes, ruta);
      log(stamp() + "Copiado ✓  →  " + ruta, "ok");
      log(stamp() + "Abrilo en el auto con el File Manager (carpeta " + (carpeta.split("/").pop() || carpeta) + ").", "mut");
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function bajarApk(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("No se encontr\xF3 el APK (" + r.status + ")");
    return new Uint8Array(await r.arrayBuffer());
  }
  async function encenderGestos() {
    var servicio = "com.t1launcher/com.t1launcher.gestos.GestosService";
    log(stamp() + "Activando el servicio de gestos de T1Launcher…", "mut");
    var actual = "";
    try {
      actual = (await shell("settings get secure enabled_accessibility_services")) || "";
    } catch (e) {
      actual = "";
    }
    actual = actual.trim();
    if (actual === "null") actual = "";
    var lista = actual ? actual.split(":").filter(function(x) { return x && x.length; }) : [];
    if (lista.indexOf(servicio) === -1) {
      lista.push(servicio);
      var valor = lista.join(":");
      await shell("settings put secure enabled_accessibility_services " + valor);
      log(stamp() + "Servicio de gestos agregado (sin borrar los que ya estaban) ✓", "ok");
    } else {
      log(stamp() + "El servicio de gestos ya estaba activo ✓", "ok");
    }
    await shell("settings put secure accessibility_enabled 1");
    await shell("am start -n com.t1launcher/.MainActivity");
    log(stamp() + "T1Launcher encendido ✓", "ok");
  }
  async function instalarT1Launcher() {
    if (!exigirConexion()) return;
    try {
      log(stamp() + "Buscando la \xFAltima versi\xF3n de T1Launcher\u2026", "mut");
      let bytes;
      try {
        bytes = await bajarApk("./apks/t1launcher.apk");
      } catch (e) {
        log(stamp() + "No encuentro el APK de T1Launcher todav\xEDa (se agrega al publicar). " + e.message, "wn");
        return;
      }
      if (await instalarApk(bytes, "T1Launcher.apk")) {
        await darPermisos("com.t1launcher");
        await encenderGestos();
      }
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function instalarAurora() {
    if (!exigirConexion()) return;
    try {
      let bytes;
      try {
        bytes = await bajarApk("./apks/aurora.apk");
      } catch (e) {
        log(stamp() + "Falta el APK de Aurora Jetour (se agrega al publicar). " + e.message, "wn");
        return;
      }
      if (await instalarApk(bytes, "AuroraStoreJetour.apk")) {
        await darPermisos("com.mainthorcar.aurorajetour");
      }
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function arreglarToque() {
    if (!exigirConexion()) return;
    try {
      await shell("appops set com.autolink.commonservice SYSTEM_ALERT_WINDOW deny");
      log(stamp() + "Capa 3D desactivada \u2713 \u2014 ahora los botones responden al toque.", "ok");
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function aceptarOculto() {
    if (!exigirConexion()) return;
    try {
      log(stamp() + "Enviando TAB \xB7 TAB \xB7 ENTER\u2026", "mut");
      await shell("input keyevent 61");
      await sleep(400);
      await shell("input keyevent 61");
      await sleep(400);
      await shell("input keyevent 66");
      log(stamp() + "Listo (61 \xB7 61 \xB7 66) \u2713", "ok");
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  async function capa3D(on) {
    if (!exigirConexion()) return;
    const estado = on ? "allow" : "deny";
    try {
      await shell("appops set com.autolink.commonservice SYSTEM_ALERT_WINDOW " + estado);
      log(stamp() + "Capa 3D " + (on ? "activada" : "desactivada") + " \u2713", "ok");
    } catch (e) {
      log(stamp() + "Error: " + (e && e.message ? e.message : e), "wn");
    }
  }
  function abrirTerminos() {
    const chk = $("termsChk");
    chk.checked = false;
    $("termsOk").disabled = true;
    $("termsOverlay").hidden = false;
  }
  function cerrarTerminos() {
    $("termsOverlay").hidden = true;
  }
  var root = document.documentElement;
  function sysDark() {
    try {
      return matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return true;
    }
  }
  function temaActual() {
    return root.getAttribute("data-theme") || (sysDark() ? "dark" : "light");
  }
  function aplicarTema(t) {
    root.setAttribute("data-theme", t);
    const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
    const moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
    const ic = $("themeIcon");
    if (ic) ic.innerHTML = t === "dark" ? moon : sun;
    try {
      localStorage.setItem("t1p-theme", t);
    } catch (e) {
    }
  }
  var appsCache = [];
  async function cargarApps() {
    const list = $("appList");
    list.innerHTML = "";
    const cargando = document.createElement("span");
    cargando.className = "ln mut";
    cargando.style.padding = "10px";
    cargando.textContent = "Cargando\u2026";
    list.appendChild(cargando);
    try {
      const sys = $("appSys").checked;
      const out = await shell("pm list packages" + (sys ? "" : " -3"));
      appsCache = out.split(/\r?\n/).map((l) => l.replace(/^package:/, "").trim()).filter(Boolean).sort();
      renderApps();
    } catch (e) {
      list.innerHTML = "";
      const s = document.createElement("span");
      s.className = "ln wn";
      s.style.padding = "10px";
      s.textContent = "Error: " + (e && e.message ? e.message : e);
      list.appendChild(s);
    }
  }
  function renderApps() {
    const q = ($("appSearch").value || "").toLowerCase();
    const list = $("appList");
    list.innerHTML = "";
    const items = appsCache.filter((p) => p.toLowerCase().includes(q)).slice(0, 500);
    if (!items.length) {
      const s = document.createElement("span");
      s.className = "ln mut";
      s.style.padding = "10px";
      s.textContent = appsCache.length ? "(sin resultados)" : "(sin apps)";
      list.appendChild(s);
      return;
    }
    for (const p of items) {
      const b = document.createElement("button");
      b.className = "approw";
      b.textContent = p;
      b.addEventListener("click", () => {
        $("permPkg").value = p;
        $("appsOverlay").hidden = true;
        log(stamp() + "Elegiste " + p + " \u2014 toc\xE1 \xABDar\xBB para darle permisos.", "acc");
      });
      list.appendChild(b);
    }
  }
  function abrirApps() {
    if (!exigirConexion()) return;
    $("appSearch").value = "";
    $("appsOverlay").hidden = false;
    cargarApps();
  }
  function init() {
    try {
      const s = localStorage.getItem("t1p-theme");
      if (s) root.setAttribute("data-theme", s);
    } catch (e) {
    }
    aplicarTema(temaActual());
    $("themeBtn").addEventListener("click", () => aplicarTema(temaActual() === "dark" ? "light" : "dark"));
    $("connect").addEventListener("click", conectar);
    $("run").addEventListener("click", ejecutar);
    $("cmd").addEventListener("keydown", (e) => {
      if (e.key === "Enter") ejecutar();
    });
    $("wipe").addEventListener("click", () => {
      $("cmd").value = "";
      $("cmd").focus();
    });
    $("copyBtn").addEventListener("click", () => {
      const txt = term.innerText, b = $("copyBtn");
      try {
        navigator.clipboard.writeText(txt).then(() => {
          b.textContent = "Copiado";
          setTimeout(() => b.textContent = "Copiar", 1200);
        }, seltext);
      } catch (e) {
        seltext();
      }
      function seltext() {
        const r = document.createRange();
        r.selectNodeContents(term);
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
    });
    $("clearBtn").addEventListener("click", () => {
      term.innerHTML = "";
      log("# limpio.", "mut");
    });
    const file = $("fileApk");
    $("pickApk").addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      if (file.files && file.files[0]) {
        $("fileName").textContent = file.files[0].name;
      }
    });
    $("installFile").addEventListener("click", () => {
      if (file.files && file.files[0]) instalarDesdeArchivo(file.files[0]);
      else log(stamp() + "Eleg\xED un APK primero.", "wn");
    });
    const fileAny = $("fileAny");
    $("pickFile").addEventListener("click", () => fileAny.click());
    fileAny.addEventListener("change", () => {
      if (fileAny.files && fileAny.files[0]) $("fileName2").textContent = fileAny.files[0].name;
    });
    $("sendFile").addEventListener("click", () => {
      if (fileAny.files && fileAny.files[0]) enviarArchivoAuto(fileAny.files[0], $("destFolder").value);
      else log(stamp() + "Eleg\xED un archivo primero.", "wn");
    });
    $("permT1L").addEventListener("click", () => exigirConexion() && darPermisos("com.t1launcher"));
    $("permAurora").addEventListener("click", () => exigirConexion() && darPermisos("com.mainthorcar.aurorajetour"));
    $("permOtra").addEventListener("click", () => {
      const p = ($("permPkg").value || "").trim();
      if (!p) {
        log(stamp() + "Escrib\xED o eleg\xED el nombre del paquete.", "wn");
        return;
      }
      if (exigirConexion()) darPermisos(p);
    });
    $("verApps").addEventListener("click", abrirApps);
    $("appsCancel").addEventListener("click", () => {
      $("appsOverlay").hidden = true;
    });
    $("appsOverlay").addEventListener("click", (e) => {
      if (e.target === $("appsOverlay")) $("appsOverlay").hidden = true;
    });
    $("appSearch").addEventListener("input", renderApps);
    $("appSys").addEventListener("change", cargarApps);
    $("btnT1L").addEventListener("click", () => {
      if (exigirConexion()) abrirTerminos();
    });
    $("btnAurora").addEventListener("click", instalarAurora);
    $("termsChk").addEventListener("change", (e) => {
      $("termsOk").disabled = !e.target.checked;
    });
    $("termsCancel").addEventListener("click", cerrarTerminos);
    $("termsOverlay").addEventListener("click", (e) => {
      if (e.target === $("termsOverlay")) cerrarTerminos();
    });
    $("termsOk").addEventListener("click", () => {
      cerrarTerminos();
      instalarT1Launcher();
    });
    $("accToque").addEventListener("click", arreglarToque);
    $("accOculto").addEventListener("click", aceptarOculto);
    $("aj3Don").addEventListener("click", () => capa3D(true));
    $("aj3Doff").addEventListener("click", () => capa3D(false));
    if (!Manager) log(stamp() + "Aviso: en iPhone no se puede abrir el USB (lo bloquea Apple). Esto funciona en una PC o Mac con Chrome o Edge.", "wn");
    else {
      log("# T1 Puente Web v1.0 \u2014 listo.", "mut");
      log("# Enchuf\xE1 el auto por USB y toc\xE1 \xABConectar\xBB.", "mut");
    }
  }
  init();
})();
