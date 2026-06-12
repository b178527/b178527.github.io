(() => {
  'use strict';

  if (window.__secToolsBound) return;
  window.__secToolsBound = true;

  const root = () => document.getElementById('sec-tools');
  const q = (sel) => root()?.querySelector(sel);
  const qa = (sel) => [...(root()?.querySelectorAll(sel) || [])];

  const toast = (msg) => {
    if (typeof Snackbar !== 'undefined') {
      Snackbar.show({ text: msg, pos: 'top-center', duration: 2000 });
    }
  };

  const copyText = async (text) => {
    if (!text) return toast('没有可复制的内容');
    try {
      await navigator.clipboard.writeText(text);
      toast('已复制');
    } catch {
      toast('复制失败');
    }
  };

  const utf8ToBytes = (str) => new TextEncoder().encode(str);
  const bytesToUtf8 = (bytes) => new TextDecoder('utf-8').decode(bytes);

  const base64Encode = (str) => {
    const bytes = utf8ToBytes(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
  };

  const base64Decode = (str) => {
    try {
      const bin = atob(str.replace(/\s/g, ''));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return bytesToUtf8(bytes);
    } catch {
      throw new Error('Base64 格式不正确');
    }
  };

  const getHexOpts = () => ({
    mode: q('[data-opt="hex-mode"]')?.value || 'utf8',
    upper: q('[data-opt="hex-upper"]')?.checked !== false,
    space: q('[data-opt="hex-space"]')?.checked !== false
  });

  const formatHexParts = (parts, opts) => {
    const list = parts.map((h) => (opts.upper ? h.toUpperCase() : h.toLowerCase()));
    return opts.space ? list.join(' ') : list.join('');
  };

  const hexEncodeUtf8 = (str, opts) => {
    const parts = [...utf8ToBytes(str)].map((b) => b.toString(16).padStart(2, '0'));
    return formatHexParts(parts, opts);
  };

  const hexEncode = (str, opts) => {
    if (opts.mode === 'unicode') {
      const parts = [];
      for (let i = 0; i < str.length; i++) {
        const cp = str.codePointAt(i);
        parts.push(cp.toString(16).padStart(cp <= 0xffff ? 4 : 6, '0'));
        if (cp > 0xffff) i++;
      }
      return formatHexParts(parts, opts);
    }
    return hexEncodeUtf8(str, opts);
  };

  const normalizeHexInput = (str) => str
    .replace(/\\x/gi, '')
    .replace(/0x/gi, '')
    .replace(/[^0-9a-fA-F]/g, '');

  const hexDecodeUtf8 = (str) => {
    const clean = normalizeHexInput(str);
    if (!clean || clean.length % 2) throw new Error('十六进制格式不正确（字节模式需为偶数位）');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return bytesToUtf8(bytes);
  };

  const hexDecodeUnicode = (str) => {
    const spaced = str.trim().split(/\s+/).filter(Boolean);
    if (spaced.length > 1) {
      return spaced.map((h) => String.fromCodePoint(parseInt(h, 16))).join('');
    }
    const clean = normalizeHexInput(str);
    if (!clean) throw new Error('十六进制格式不正确');
    if (clean.length % 4 !== 0) {
      throw new Error('字符码模式需为 4 的倍数，或使用空格分隔各字符');
    }
    return clean.match(/.{4}/g).map((h) => String.fromCharCode(parseInt(h, 16))).join('');
  };

  const hexDecode = (str, opts) => {
    if (opts.mode === 'unicode') return hexDecodeUnicode(str);
    return hexDecodeUtf8(str);
  };

  const unicodeEncode = (str, mode) => [...str].map((ch) => {
    const cp = ch.codePointAt(0);
    if (cp < 128 && mode === 'unicode') return ch;
    if (mode === 'unicode') {
      if (cp > 0xffff) return `\\u{${cp.toString(16)}}`;
      return `\\u${cp.toString(16).padStart(4, '0')}`;
    }
    if (mode === 'html-dec') return `&#${cp};`;
    return `&#x${cp.toString(16)};`;
  }).join('');

  const unicodeDecode = (str) => {
    let s = str;
    s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  };

  const toBigInt = (clean, fromBase) => {
    const v = clean.replace(/\s/g, '');
    if (!v) throw new Error('请输入有效数值');
    if (fromBase === 16) return BigInt(`0x${v.replace(/^0x/i, '')}`);
    if (fromBase === 8) return BigInt(`0o${v}`);
    if (fromBase === 2) return BigInt(`0b${v}`);
    return BigInt(v);
  };

  const radixConvert = (value, fromBase) => {
    const num = toBigInt(value.trim(), fromBase);
    return {
      2: num.toString(2),
      8: num.toString(8),
      10: num.toString(10),
      16: num.toString(16).toUpperCase()
    };
  };

  const md5 = (() => {
    const hex = (n) => {
      let s = '';
      for (let j = 0; j < 4; j++) s += ((n >> (j * 8)) & 255).toString(16).padStart(2, '0');
      return s;
    };
    const md5cycle = (x, k) => {
      let [a, b, c, d] = x;
      const ff = (q, a, b, c, d, x, s, t) => {
        a = (a + q + x + t) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
      };
      const gg = (q, a, b, c, d, x, s, t) => {
        a = (a + q + x + t) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
      };
      const hh = (q, a, b, c, d, x, s, t) => {
        a = (a + q + x + t) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
      };
      const ii = (q, a, b, c, d, x, s, t) => {
        a = (a + q + x + t) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
      };
      a = ff((b & c) | (~b & d), a, b, c, d, k[0], 7, -680876936);
      d = ff((a & b) | (~a & c), d, a, b, c, k[1], 12, -389564586);
      c = ff((d & a) | (~d & b), c, d, a, b, k[2], 17, 606105819);
      b = ff((c & d) | (~c & a), b, c, d, a, k[3], 22, -1044525330);
      a = ff((b & c) | (~b & d), a, b, c, d, k[4], 7, -176418897);
      d = ff((a & b) | (~a & c), d, a, b, c, k[5], 12, 1200080426);
      c = ff((d & a) | (~d & b), c, d, a, b, k[6], 17, -1473231341);
      b = ff((c & d) | (~c & a), b, c, d, a, k[7], 22, -45705983);
      a = ff((b & c) | (~b & d), a, b, c, d, k[8], 7, 1770035416);
      d = ff((a & b) | (~a & c), d, a, b, c, k[9], 12, -1958414417);
      c = ff((d & a) | (~d & b), c, d, a, b, k[10], 17, -42063);
      b = ff((c & d) | (~c & a), b, c, d, a, k[11], 22, -1990404162);
      a = ff((b & c) | (~b & d), a, b, c, d, k[12], 7, 1804603682);
      d = ff((a & b) | (~a & c), d, a, b, c, k[13], 12, -40341101);
      c = ff((d & a) | (~d & b), c, d, a, b, k[14], 17, -1502002290);
      b = ff((c & d) | (~c & a), b, c, d, a, k[15], 22, 1236535329);
      a = gg((b & d) | (c & ~d), a, b, c, d, k[1], 5, -165796510);
      d = gg((a & c) | (b & ~c), d, a, b, c, k[6], 9, -1069501632);
      c = gg((d & b) | (a & ~b), c, d, a, b, k[11], 14, 643717713);
      b = gg((c & a) | (d & ~a), b, c, d, a, k[0], 20, -373897302);
      a = gg((b & d) | (c & ~d), a, b, c, d, k[5], 5, -701558691);
      d = gg((a & c) | (b & ~c), d, a, b, c, k[10], 9, 38016083);
      c = gg((d & b) | (a & ~b), c, d, a, b, k[15], 14, -660478335);
      b = gg((c & a) | (d & ~a), b, c, d, a, k[4], 20, -405537848);
      a = gg((b & d) | (c & ~d), a, b, c, d, k[9], 5, 568446438);
      d = gg((a & c) | (b & ~c), d, a, b, c, k[14], 9, -1019803690);
      c = gg((d & b) | (a & ~b), c, d, a, b, k[3], 14, -187363961);
      b = gg((c & a) | (d & ~a), b, c, d, a, k[8], 20, 1163531501);
      a = gg((b & d) | (c & ~d), a, b, c, d, k[13], 5, -1444681467);
      d = gg((a & c) | (b & ~c), d, a, b, c, k[2], 9, -51403784);
      c = gg((d & b) | (a & ~b), c, d, a, b, k[7], 14, 1735328473);
      b = gg((c & a) | (d & ~a), b, c, d, a, k[12], 20, -1926607734);
      a = hh(b ^ c ^ d, a, b, c, d, k[5], 4, -378558);
      d = hh(a ^ b ^ c, d, a, b, c, k[8], 11, -2022574463);
      c = hh(d ^ a ^ b, c, d, a, b, k[11], 16, 1839030562);
      b = hh(c ^ d ^ a, b, c, d, a, k[14], 23, -35309556);
      a = hh(b ^ c ^ d, a, b, c, d, k[1], 4, -1530992060);
      d = hh(a ^ b ^ c, d, a, b, c, k[4], 11, 1272893353);
      c = hh(d ^ a ^ b, c, d, a, b, k[7], 16, -155497632);
      b = hh(c ^ d ^ a, b, c, d, a, k[10], 23, -1094730640);
      a = hh(b ^ c ^ d, a, b, c, d, k[13], 4, 681279174);
      d = hh(a ^ b ^ c, d, a, b, c, k[0], 11, -358537222);
      c = hh(d ^ a ^ b, c, d, a, b, k[3], 16, -722521979);
      b = hh(c ^ d ^ a, b, c, d, a, k[6], 23, 76029189);
      a = hh(b ^ c ^ d, a, b, c, d, k[9], 4, -640364487);
      d = hh(a ^ b ^ c, d, a, b, c, k[12], 11, -421815835);
      c = hh(d ^ a ^ b, c, d, a, b, k[15], 16, 530742520);
      b = hh(c ^ d ^ a, b, c, d, a, k[2], 23, -995338651);
      a = ii(c ^ (b | ~d), a, b, c, d, k[0], 6, -198630844);
      d = ii(b ^ (a | ~c), d, a, b, c, k[7], 10, 1126891415);
      c = ii(a ^ (d | ~b), c, d, a, b, k[14], 15, -1416354905);
      b = ii(d ^ (c | ~a), b, c, d, a, k[5], 21, -57434055);
      a = ii(c ^ (b | ~d), a, b, c, d, k[12], 6, 1700485571);
      d = ii(b ^ (a | ~c), d, a, b, c, k[3], 10, -1894986606);
      c = ii(a ^ (d | ~b), c, d, a, b, k[10], 15, -1051523);
      b = ii(d ^ (c | ~a), b, c, d, a, k[1], 21, -2054922799);
      a = ii(c ^ (b | ~d), a, b, c, d, k[8], 6, 1873313359);
      d = ii(b ^ (a | ~c), d, a, b, c, k[15], 10, -30611744);
      c = ii(a ^ (d | ~b), c, d, a, b, k[6], 15, -1560198380);
      b = ii(d ^ (c | ~a), b, c, d, a, k[13], 21, 1309151649);
      a = ii(c ^ (b | ~d), a, b, c, d, k[4], 6, -145523070);
      d = ii(b ^ (a | ~c), d, a, b, c, k[11], 10, -1120210379);
      c = ii(a ^ (d | ~b), c, d, a, b, k[2], 15, 718787259);
      b = ii(d ^ (c | ~a), b, c, d, a, k[9], 21, -343485551);
      x[0] = (a + x[0]) | 0;
      x[1] = (b + x[1]) | 0;
      x[2] = (c + x[2]) | 0;
      x[3] = (d + x[3]) | 0;
    };
    const md5blk = (s) => {
      const md5blks = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    };
    return (str) => {
      const n = str.length;
      let state = [1732584193, -271733879, -1732584194, 271733878];
      let i;
      for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(str.substring(i - 64, i)));
      str = str.substring(i - 64);
      const tail = new Array(16).fill(0);
      for (i = 0; i < str.length; i++) tail[i >> 2] |= str.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) {
        md5cycle(state, tail);
        tail.fill(0);
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state.map(hex).join('');
    };
  })();

  const sha = async (algo, text) => {
    const buf = await crypto.subtle.digest(algo, utf8ToBytes(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const genPassword = (len, opts) => {
    let chars = '';
    if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.num) chars += '0123456789';
    if (opts.sym) chars += '!@#$%^&*()-_=+[]{};:,.?/';
    if (opts.noambig) chars = chars.replace(/[0O1lI]/g, '');
    if (!chars) throw new Error('请至少选择一种字符类型');
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += chars[arr[i] % chars.length];
    return pwd;
  };

  const getIn = (name) => q(`[data-in="${name}"]`)?.value ?? '';

  const setTextOut = (name, val) => {
    const el = q(`textarea[data-out="${name}"]`);
    if (el) el.value = val;
  };

  const clampPwdLen = (n) => Math.min(128, Math.max(4, n));

  const getPwdLen = () => {
    const raw = parseInt(q('[data-opt="pwd-len"]')?.value, 10);
    return clampPwdLen(Number.isFinite(raw) ? raw : 16);
  };

  const setPwdLen = (n) => {
    const el = q('[data-opt="pwd-len"]');
    if (el) el.value = String(clampPwdLen(n));
  };

  const getPwdOpts = () => ({
    len: getPwdLen(),
    lower: q('[data-opt="pwd-lower"]')?.checked,
    upper: q('[data-opt="pwd-upper"]')?.checked,
    num: q('[data-opt="pwd-num"]')?.checked,
    sym: q('[data-opt="pwd-sym"]')?.checked,
    noambig: q('[data-opt="pwd-noambig"]')?.checked
  });

  const switchTab = (tab) => {
    qa('.sec-tab').forEach((t) => t.classList.toggle('active', t === tab));
    qa('.sec-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  };

  const runAction = async (act, btn) => {
    switch (act) {
      case 'base64-enc':
        setTextOut('base64', base64Encode(getIn('base64')));
        break;
      case 'base64-dec':
        setTextOut('base64', base64Decode(getIn('base64')));
        break;
      case 'url-enc-comp':
        setTextOut('url', encodeURIComponent(getIn('url')));
        break;
      case 'url-enc':
        setTextOut('url', encodeURI(getIn('url')));
        break;
      case 'url-dec':
        try {
          setTextOut('url', decodeURIComponent(getIn('url')));
        } catch {
          throw new Error('URL 编码格式不正确');
        }
        break;
      case 'hex-enc':
        setTextOut('hex', hexEncode(getIn('hex'), getHexOpts()));
        break;
      case 'hex-dec':
        setTextOut('hex', hexDecode(getIn('hex'), getHexOpts()));
        break;
      case 'uni-enc':
        setTextOut('unicode', unicodeEncode(getIn('unicode'), q('[data-opt="uni-mode"]')?.value));
        break;
      case 'uni-dec':
        setTextOut('unicode', unicodeDecode(getIn('unicode')));
        break;
      case 'radix-convert': {
        const from = parseInt(q('[data-opt="radix-in"]')?.value, 10);
        const result = radixConvert(getIn('radix'), from);
        qa('[data-radix]').forEach((el) => {
          el.textContent = result[el.dataset.radix];
        });
        break;
      }
      case 'hash-run': {
        const text = getIn('hash');
        q('[data-hash="md5"]').textContent = md5(text);
        q('[data-hash="sha1"]').textContent = await sha('SHA-1', text);
        q('[data-hash="sha256"]').textContent = await sha('SHA-256', text);
        q('[data-hash="sha512"]').textContent = await sha('SHA-512', text);
        break;
      }
      case 'pwd-len-dec':
        setPwdLen(getPwdLen() - 1);
        break;
      case 'pwd-len-inc':
        setPwdLen(getPwdLen() + 1);
        break;
      case 'pwd-gen':
        setTextOut('password', genPassword(getPwdOpts().len, getPwdOpts()));
        break;
      case 'pwd-gen5': {
        const o = getPwdOpts();
        setTextOut('password', Array.from({ length: 5 }, () => genPassword(o.len, o)).join('\n'));
        break;
      }
      case 'copy-out':
        copyText(q(`textarea[data-out="${btn.dataset.out}"]`)?.value || '');
        break;
      case 'swap': {
        const pair = btn.dataset.pair;
        const input = q(`[data-in="${pair}"]`);
        const output = q(`textarea[data-out="${pair}"]`);
        if (output?.value) {
          input.value = output.value;
          output.value = '';
        }
        break;
      }
      case 'clear': {
        const pair = btn.dataset.pair;
        const input = q(`[data-in="${pair}"]`);
        const output = q(`textarea[data-out="${pair}"]`) || q(`[data-out="${pair}"]`);
        if (input) input.value = '';
        if (output) {
          if (output.tagName === 'TEXTAREA' || output.tagName === 'INPUT') {
            output.value = '';
          } else {
            output.querySelectorAll('output').forEach((o) => { o.textContent = ''; });
          }
        }
        break;
      }
      default:
        break;
    }
  };

  document.addEventListener('click', async (e) => {
    const tools = root();
    if (!tools || !tools.contains(e.target)) return;

    const tab = e.target.closest('.sec-tab');
    if (tab) {
      e.preventDefault();
      switchTab(tab);
      return;
    }

    const copyRadix = e.target.closest('[data-copy-radix]');
    if (copyRadix) {
      e.preventDefault();
      copyText(q(`[data-radix="${copyRadix.dataset.copyRadix}"]`)?.textContent || '');
      return;
    }

    const copyHash = e.target.closest('[data-copy-hash]');
    if (copyHash) {
      e.preventDefault();
      copyText(q(`[data-hash="${copyHash.dataset.copyHash}"]`)?.textContent || '');
      return;
    }

    const btn = e.target.closest('[data-act]');
    if (!btn) return;

    e.preventDefault();
    try {
      await runAction(btn.dataset.act, btn);
    } catch (err) {
      toast(err.message || '处理失败');
    }
  });

  document.addEventListener('blur', (e) => {
    if (!root()?.contains(e.target)) return;
    if (e.target.matches('[data-opt="pwd-len"]')) {
      setPwdLen(getPwdLen());
    }
  }, true);
})();
