const vm = require('vm');
const https = require('https');

/* ─────────────────────────────────────────────────────────────
   Judge0 CE via RapidAPI
   Set JUDGE0_API_KEY in server/.env to enable all languages.
   Without key → JS falls back to Node vm, others return error.
───────────────────────────────────────────────────────────── */
const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_KEY  = process.env.JUDGE0_API_KEY || '';

const LANG_ID = {
  javascript: 63,  // Node.js 12.14.0
  python:     71,  // Python 3.8.1
  cpp:        54,  // C++ (GCC 9.2.0)
  c:          50,  // C (GCC 9.2.0)
  java:       62,  // Java (OpenJDK 13.0.1)
};

/* ── Test Cases ─────────────────────────────────────────── */
const TEST_CASES = {
  'two-sum': [
    { id:1,  input:{ nums:[2,7,11,15],      target:9  }, expected:[0,1] },
    { id:2,  input:{ nums:[3,2,4],          target:6  }, expected:[1,2] },
    { id:3,  input:{ nums:[3,3],            target:6  }, expected:[0,1] },
    { id:4,  input:{ nums:[1,5,3,2],        target:5  }, expected:[2,3] },
    { id:5,  input:{ nums:[-1,-2,-3,-4,-5], target:-8 }, expected:[2,4] },
    { id:6,  input:{ nums:[0,4,3,0],        target:0  }, expected:[0,3] },
    { id:7,  input:{ nums:[1,2,3,4,5,6],    target:11 }, expected:[4,5] },
    { id:8,  input:{ nums:[2,5,5,11],       target:10 }, expected:[1,2] },
    { id:9,  input:{ nums:[1,3,4,2],        target:6  }, expected:[2,3] },
    { id:10, input:{ nums:[0,0],            target:0  }, expected:[0,1] },
  ],
  'valid-parentheses': [
    { id:1,  input:{ s:'()' },      expected:true  },
    { id:2,  input:{ s:'()[]{}' },  expected:true  },
    { id:3,  input:{ s:'(]' },      expected:false },
    { id:4,  input:{ s:'([)]' },    expected:false },
    { id:5,  input:{ s:'{[]}' },    expected:true  },
    { id:6,  input:{ s:'' },        expected:true  },
    { id:7,  input:{ s:'(((' },     expected:false },
    { id:8,  input:{ s:']' },       expected:false },
    { id:9,  input:{ s:'[' },       expected:false },
    { id:10, input:{ s:'(){}[]' },  expected:true  },
  ],
  'longest-substring': [
    { id:1,  input:{ s:'abcabcbb' }, expected:3 },
    { id:2,  input:{ s:'bbbbb' },    expected:1 },
    { id:3,  input:{ s:'pwwkew' },   expected:3 },
    { id:4,  input:{ s:'' },         expected:0 },
    { id:5,  input:{ s:'a' },        expected:1 },
    { id:6,  input:{ s:'aab' },      expected:2 },
    { id:7,  input:{ s:'dvdf' },     expected:3 },
    { id:8,  input:{ s:'anviaj' },   expected:5 },
    { id:9,  input:{ s:'tmmzuxt' },  expected:5 },
    { id:10, input:{ s:'abba' },     expected:2 },
  ],
  'merge-intervals': [
    { id:1,  input:{ intervals:[[1,3],[2,6],[8,10],[15,18]] },        expected:[[1,6],[8,10],[15,18]] },
    { id:2,  input:{ intervals:[[1,4],[4,5]] },                       expected:[[1,5]] },
    { id:3,  input:{ intervals:[[1,4],[2,3]] },                       expected:[[1,4]] },
    { id:4,  input:{ intervals:[[1,2],[3,4],[5,6]] },                 expected:[[1,2],[3,4],[5,6]] },
    { id:5,  input:{ intervals:[[1,10],[2,3]] },                      expected:[[1,10]] },
    { id:6,  input:{ intervals:[[1,3]] },                             expected:[[1,3]] },
    { id:7,  input:{ intervals:[[2,3],[4,5],[6,7],[8,9],[1,10]] },    expected:[[1,10]] },
    { id:8,  input:{ intervals:[[1,4],[0,4]] },                       expected:[[0,4]] },
    { id:9,  input:{ intervals:[[1,4],[0,0]] },                       expected:[[0,0],[1,4]] },
    { id:10, input:{ intervals:[[1,4],[2,3],[3,5]] },                 expected:[[1,5]] },
  ],
  'binary-search': [
    { id:1,  input:{ nums:[-1,0,3,5,9,12], target:9  }, expected:4  },
    { id:2,  input:{ nums:[-1,0,3,5,9,12], target:2  }, expected:-1 },
    { id:3,  input:{ nums:[5],             target:5  }, expected:0  },
    { id:4,  input:{ nums:[5],             target:3  }, expected:-1 },
    { id:5,  input:{ nums:[1,2,3,4,5],     target:1  }, expected:0  },
    { id:6,  input:{ nums:[1,2,3,4,5],     target:5  }, expected:4  },
    { id:7,  input:{ nums:[1,3,5,7,9,11],  target:7  }, expected:3  },
    { id:8,  input:{ nums:[2,4,6,8,10],    target:6  }, expected:2  },
    { id:9,  input:{ nums:[1],             target:1  }, expected:0  },
    { id:10, input:{ nums:[1,2,3],         target:4  }, expected:-1 },
  ],
  'lru-cache': [
    { id:1,  input:{ capacity:2, ops:[['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2],['put',4,4],['get',1],['get',3],['get',4]] }, expected:[1,-1,-1,3,4] },
    { id:2,  input:{ capacity:1, ops:[['put',1,1],['put',2,2],['get',1],['get',2]] },                                                      expected:[-1,2] },
    { id:3,  input:{ capacity:2, ops:[['put',1,1],['put',2,2],['get',1],['put',3,3],['get',1],['get',3]] },                                expected:[1,1,3] },
    { id:4,  input:{ capacity:2, ops:[['get',2],['put',2,6],['get',1],['put',1,5],['put',1,2],['get',1],['get',2]] },                      expected:[-1,-1,2,6] },
    { id:5,  input:{ capacity:2, ops:[['put',2,1],['put',1,1],['put',2,3],['put',4,1],['get',1],['get',2]] },                              expected:[-1,3] },
    { id:6,  input:{ capacity:3, ops:[['put',1,1],['put',2,2],['put',3,3],['get',1],['put',4,4],['get',2],['get',3],['get',4]] },          expected:[1,2,3,4] },
    { id:7,  input:{ capacity:1, ops:[['put',1,1],['get',1],['put',2,2],['get',1],['get',2]] },                                            expected:[1,-1,2] },
    { id:8,  input:{ capacity:2, ops:[['put',1,0],['put',2,2],['get',1],['put',3,3],['get',2],['put',4,4],['get',1],['get',3],['get',4]] },expected:[0,-1,-1,3,4] },
    { id:9,  input:{ capacity:2, ops:[['put',1,1],['get',1],['put',1,11],['get',1]] },                                                     expected:[1,11] },
    { id:10, input:{ capacity:2, ops:[['put',1,1],['put',2,2],['get',3]] },                                                                expected:[-1] },
  ],
};

/* ────────────────────────────────────────────────────────────
   CODE HARNESS BUILDERS
   Each returns a complete, runnable program for that language
   that prints JSON output to stdout.
──────────────────────────────────────────────────────────── */

/* ── JavaScript ── */
function buildJS(problemId, userCode, tc) {
  let call;
  switch (problemId) {
    case 'two-sum':
      call = `const __r = twoSum(${JSON.stringify(tc.input.nums)}, ${tc.input.target});`; break;
    case 'valid-parentheses':
      call = `const __r = isValid(${JSON.stringify(tc.input.s)});`; break;
    case 'longest-substring':
      call = `const __r = lengthOfLongestSubstring(${JSON.stringify(tc.input.s)});`; break;
    case 'merge-intervals':
      call = `const __r = merge(${JSON.stringify(tc.input.intervals)});`; break;
    case 'binary-search':
      call = `const __r = search(${JSON.stringify(tc.input.nums)}, ${tc.input.target});`; break;
    case 'lru-cache': {
      const ops = tc.input.ops;
      const lines = [
        `const __cache = new LRUCache(${tc.input.capacity});`,
        `const __out = [];`,
        ...ops.map(op => op[0] === 'put'
          ? `__cache.put(${op[1]}, ${op[2]});`
          : `__out.push(__cache.get(${op[1]}));`),
        `const __r = __out;`,
      ];
      call = lines.join('\n');
      break;
    }
    default: call = `const __r = null;`;
  }
  return `${userCode}\n${call}\nconsole.log(JSON.stringify(__r));`;
}

/* ── Python ── */
function buildPython(problemId, userCode, tc) {
  let call;
  switch (problemId) {
    case 'two-sum':
      call = `result = Solution().twoSum(${JSON.stringify(tc.input.nums)}, ${tc.input.target})`; break;
    case 'valid-parentheses':
      call = `result = Solution().isValid(${JSON.stringify(tc.input.s)})`; break;
    case 'longest-substring':
      call = `result = Solution().lengthOfLongestSubstring(${JSON.stringify(tc.input.s)})`; break;
    case 'merge-intervals':
      call = `result = Solution().merge(${JSON.stringify(tc.input.intervals)})`; break;
    case 'binary-search':
      call = `result = Solution().search(${JSON.stringify(tc.input.nums)}, ${tc.input.target})`; break;
    case 'lru-cache': {
      const lines = [`c = LRUCache(${tc.input.capacity})`, `out = []`];
      for (const op of tc.input.ops) {
        if (op[0] === 'put') lines.push(`c.put(${op[1]}, ${op[2]})`);
        else lines.push(`out.append(c.get(${op[1]}))`);
      }
      lines.push(`result = out`);
      call = lines.join('\n');
      break;
    }
    default: call = `result = None`;
  }
  return `import json\nfrom typing import List, Optional\n${userCode}\n${call}\nprint(json.dumps(result))`;
}

/* ── C++ ── */
function buildCpp(problemId, userCode, tc) {
  const header = `#include <bits/stdc++.h>\nusing namespace std;\n`;
  let main;
  switch (problemId) {
    case 'two-sum': {
      const nums = JSON.stringify(tc.input.nums).replace('[','{').replace(']','}');
      main = `int main(){
  vector<int> nums = ${nums};
  int target = ${tc.input.target};
  vector<int> r = twoSum(nums, target);
  cout << "[" << r[0] << "," << r[1] << "]" << endl;
  return 0;
}`;
      break;
    }
    case 'valid-parentheses': {
      main = `int main(){
  string s = ${JSON.stringify(tc.input.s)};
  bool r = isValid(s);
  cout << (r ? "true" : "false") << endl;
  return 0;
}`;
      break;
    }
    case 'longest-substring': {
      main = `int main(){
  string s = ${JSON.stringify(tc.input.s)};
  int r = lengthOfLongestSubstring(s);
  cout << r << endl;
  return 0;
}`;
      break;
    }
    case 'merge-intervals': {
      const intervals = tc.input.intervals.map(iv => `{${iv[0]},${iv[1]}}`).join(',');
      main = `int main(){
  vector<vector<int>> intervals = {${intervals}};
  vector<vector<int>> r = merge(intervals);
  cout << "[";
  for(int i=0;i<(int)r.size();i++){
    if(i>0) cout<<",";
    cout<<"["<<r[i][0]<<","<<r[i][1]<<"]";
  }
  cout << "]" << endl;
  return 0;
}`;
      break;
    }
    case 'binary-search': {
      const nums = JSON.stringify(tc.input.nums).replace('[','{').replace(']','}');
      main = `int main(){
  vector<int> nums = ${nums};
  int target = ${tc.input.target};
  int r = search(nums, target);
  cout << r << endl;
  return 0;
}`;
      break;
    }
    case 'lru-cache': {
      const opLines = tc.input.ops.map(op =>
        op[0] === 'put'
          ? `  cache.put(${op[1]},${op[2]});`
          : `  out.push_back(cache.get(${op[1]}));`
      ).join('\n');
      main = `int main(){
  LRUCache cache(${tc.input.capacity});
  vector<int> out;
${opLines}
  cout << "[";
  for(int i=0;i<(int)out.size();i++){
    if(i>0) cout<<",";
    cout<<out[i];
  }
  cout << "]" << endl;
  return 0;
}`;
      break;
    }
    default: main = `int main(){ cout << "null" << endl; return 0; }`;
  }
  return `${header}${userCode}\n${main}`;
}

/* ── C ── */
function buildC(problemId, userCode, tc) {
  const header = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n`;
  let main;
  switch (problemId) {
    case 'valid-parentheses': {
      main = `int main(){
  char s[] = ${JSON.stringify(tc.input.s)};
  bool r = isValid(s);
  printf("%s\\n", r ? "true" : "false");
  return 0;
}`;
      break;
    }
    case 'longest-substring': {
      main = `int main(){
  char s[] = ${JSON.stringify(tc.input.s)};
  int r = lengthOfLongestSubstring(s);
  printf("%d\\n", r);
  return 0;
}`;
      break;
    }
    case 'binary-search': {
      const nums = tc.input.nums.join(',');
      main = `int main(){
  int nums[] = {${nums}};
  int size = ${tc.input.nums.length};
  int r = search(nums, size, ${tc.input.target});
  printf("%d\\n", r);
  return 0;
}`;
      break;
    }
    default: {
      main = `int main(){ printf("C: unsupported problem for auto-judge\\n"); return 0; }`;
    }
  }
  return `${header}${userCode}\n${main}`;
}

/* ── Java ── */
function buildJava(problemId, userCode, tc) {
  let call;
  switch (problemId) {
    case 'two-sum': {
      const nums = JSON.stringify(tc.input.nums).replace('[','{').replace(']','}');
      call = `
        int[] nums = ${nums};
        int target = ${tc.input.target};
        int[] r = new Solution().twoSum(nums, target);
        System.out.println("[" + r[0] + "," + r[1] + "]");`;
      break;
    }
    case 'valid-parentheses': {
      call = `
        boolean r = new Solution().isValid(${JSON.stringify(tc.input.s)});
        System.out.println(r);`;
      break;
    }
    case 'longest-substring': {
      call = `
        int r = new Solution().lengthOfLongestSubstring(${JSON.stringify(tc.input.s)});
        System.out.println(r);`;
      break;
    }
    case 'binary-search': {
      const nums = JSON.stringify(tc.input.nums).replace('[','{').replace(']','}');
      call = `
        int[] nums = ${nums};
        int r = new Solution().search(nums, ${tc.input.target});
        System.out.println(r);`;
      break;
    }
    default:
      call = `System.out.println("null");`;
  }
  return `import java.util.*;\n${userCode}\nclass Main { public static void main(String[] args) {${call}} }`;
}

/* ────────────────────────────────────────────────────────────
   JUDGE0 API
──────────────────────────────────────────────────────────── */
function judge0Request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: JUDGE0_HOST,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_KEY,
        'X-RapidAPI-Host': JUDGE0_HOST,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error: ${raw}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function submitToJudge0(sourceCode, languageId) {
  // Create submission with wait=true (synchronous, up to 5s)
  const result = await judge0Request('POST',
    '/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,status,compile_output',
    { source_code: sourceCode, language_id: languageId, cpu_time_limit: 3, memory_limit: 128000 }
  );
  return result;
}

/* Parse Judge0 output and compare to expected */
function parseJudge0Result(j0, expected) {
  if (j0.status?.id === 6) {
    // Compilation error
    return { passed: false, output: null, expected, error: `Compilation Error: ${j0.compile_output || ''}`.trim() };
  }
  if (j0.status?.id > 3) {
    // Runtime error / TLE / MLE
    return { passed: false, output: null, expected, error: `${j0.status.description}: ${j0.stderr || ''}`.trim() };
  }
  const raw = (j0.stdout || '').trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try boolean/number fallback
    if (raw === 'true')  parsed = true;
    else if (raw === 'false') parsed = false;
    else if (!isNaN(raw)) parsed = Number(raw);
    else parsed = raw;
  }
  const passed = JSON.stringify(parsed) === JSON.stringify(expected);
  return { passed, output: parsed, expected, error: null };
}

/* ────────────────────────────────────────────────────────────
   JS LOCAL RUNNER (fallback when no Judge0 key)
──────────────────────────────────────────────────────────── */
function runJSLocal(problemId, code, cases) {
  const results = [];
  for (const tc of cases) {
    try {
      const fullCode = buildJS(problemId, code, tc);
      const sandbox = {};
      const captured = [];
      const ctx = vm.createContext({
        ...sandbox,
        console: { log: (...a) => captured.push(a.map(String).join(' ')) },
        JSON,
      });
      vm.runInContext(fullCode, ctx, { timeout: 3000 });
      const raw = captured[0] || 'null';
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { parsed = raw === 'true' ? true : raw === 'false' ? false : Number(raw) || raw; }
      const passed = JSON.stringify(parsed) === JSON.stringify(tc.expected);
      results.push({ passed, output: parsed, expected: tc.expected, error: null });
    } catch (e) {
      results.push({ passed: false, output: null, expected: tc.expected, error: e.message });
    }
  }
  return Promise.resolve(results);
}

/* ────────────────────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────────────────────── */
exports.judge = async function({ problemId, code, language, mode }) {
  const allCases = TEST_CASES[problemId] || [];
  const cases = mode === 'run' ? allCases.slice(0, 3) : allCases;

  // JavaScript without Judge0 key → fast local vm
  if (language === 'javascript' && !JUDGE0_KEY) {
    const results = await runJSLocal(problemId, code, cases);
    const passed = results.filter(r => r.passed).length;
    const total  = results.length;
    return { results, passed, total, score: Math.round((passed / total) * 100), mode };
  }

  // All languages via Judge0
  if (!JUDGE0_KEY) {
    const err = 'Judge0 API key not configured. Add JUDGE0_API_KEY to server/.env';
    const results = cases.map(tc => ({ passed: false, output: null, expected: tc.expected, error: err }));
    return { results, passed: 0, total: cases.length, score: 0, mode };
  }

  const languageId = LANG_ID[language];
  if (!languageId) {
    const results = cases.map(tc => ({ passed: false, output: null, expected: tc.expected, error: `Unsupported language: ${language}` }));
    return { results, passed: 0, total: cases.length, score: 0, mode };
  }

  // Build programs for each test case
  const programs = cases.map(tc => {
    switch (language) {
      case 'javascript': return buildJS(problemId, code, tc);
      case 'python':     return buildPython(problemId, code, tc);
      case 'cpp':        return buildCpp(problemId, code, tc);
      case 'c':          return buildC(problemId, code, tc);
      case 'java':       return buildJava(problemId, code, tc);
      default:           return code;
    }
  });

  // Run all test cases in parallel via Judge0
  const j0Results = await Promise.all(
    programs.map(prog => submitToJudge0(prog, languageId).catch(err => ({ _error: err.message })))
  );

  const results = j0Results.map((j0, i) => {
    if (j0._error) return { passed: false, output: null, expected: cases[i].expected, error: j0._error };
    return parseJudge0Result(j0, cases[i].expected);
  });

  const passed = results.filter(r => r.passed).length;
  const total  = results.length;
  return { results, passed, total, score: Math.round((passed / total) * 100), mode };
};

exports.TEST_CASES = TEST_CASES;
