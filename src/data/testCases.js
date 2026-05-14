/**
 * Test cases for all problems.
 * Each problem has ~7 test cases (40 total across 6 problems).
 * Format: { input, expected, explanation }
 */

export const TEST_CASES = {
  'two-sum': [
    { id: 1, input: { nums: [2, 7, 11, 15], target: 9 },       expected: [0, 1], explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
    { id: 2, input: { nums: [3, 2, 4],      target: 6 },       expected: [1, 2], explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    { id: 3, input: { nums: [3, 3],          target: 6 },       expected: [0, 1], explanation: 'nums[0] + nums[1] = 3 + 3 = 6' },
    { id: 4, input: { nums: [1, 5, 3, 2],   target: 5 },       expected: [2, 3], explanation: 'nums[2] + nums[3] = 3 + 2 = 5' },
    { id: 5, input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4], explanation: 'nums[2] + nums[4] = -3 + -5 = -8' },
    { id: 6, input: { nums: [0, 4, 3, 0],   target: 0 },       expected: [0, 3], explanation: 'nums[0] + nums[3] = 0 + 0 = 0' },
    { id: 7, input: { nums: [1, 2, 3, 4, 5, 6], target: 11 }, expected: [4, 5], explanation: 'nums[4] + nums[5] = 5 + 6 = 11' },
  ],

  'valid-parentheses': [
    { id: 1, input: { s: '()' },       expected: true,  explanation: 'Simple valid pair' },
    { id: 2, input: { s: '()[]{}' },   expected: true,  explanation: 'Multiple valid pairs' },
    { id: 3, input: { s: '(]' },       expected: false, explanation: 'Mismatched brackets' },
    { id: 4, input: { s: '([)]' },     expected: false, explanation: 'Interleaved brackets' },
    { id: 5, input: { s: '{[]}' },     expected: true,  explanation: 'Nested valid brackets' },
    { id: 6, input: { s: '' },         expected: true,  explanation: 'Empty string is valid' },
    { id: 7, input: { s: '(((' },      expected: false, explanation: 'Unclosed brackets' },
  ],

  'longest-substring': [
    { id: 1, input: { s: 'abcabcbb' }, expected: 3,  explanation: '"abc" is the longest' },
    { id: 2, input: { s: 'bbbbb' },    expected: 1,  explanation: '"b" only' },
    { id: 3, input: { s: 'pwwkew' },   expected: 3,  explanation: '"wke" or "kew"' },
    { id: 4, input: { s: '' },         expected: 0,  explanation: 'Empty string' },
    { id: 5, input: { s: 'a' },        expected: 1,  explanation: 'Single char' },
    { id: 6, input: { s: 'aab' },      expected: 2,  explanation: '"ab"' },
    { id: 7, input: { s: 'dvdf' },     expected: 3,  explanation: '"vdf"' },
  ],

  'merge-intervals': [
    { id: 1, input: { intervals: [[1,3],[2,6],[8,10],[15,18]] }, expected: [[1,6],[8,10],[15,18]], explanation: 'Merge [1,3] and [2,6]' },
    { id: 2, input: { intervals: [[1,4],[4,5]] },                expected: [[1,5]],                explanation: 'Touch at 4' },
    { id: 3, input: { intervals: [[1,4],[2,3]] },                expected: [[1,4]],                explanation: 'One inside another' },
    { id: 4, input: { intervals: [[1,2],[3,4],[5,6]] },          expected: [[1,2],[3,4],[5,6]],     explanation: 'No overlaps' },
    { id: 5, input: { intervals: [[1,10],[2,3]] },               expected: [[1,10]],               explanation: 'Contained interval' },
    { id: 6, input: { intervals: [[1,3]] },                      expected: [[1,3]],                explanation: 'Single interval' },
    { id: 7, input: { intervals: [[2,3],[4,5],[6,7],[8,9],[1,10]] }, expected: [[1,10]],            explanation: 'All merge into one' },
  ],

  'binary-search': [
    { id: 1, input: { nums: [-1,0,3,5,9,12], target: 9 },  expected: 4,  explanation: '9 is at index 4' },
    { id: 2, input: { nums: [-1,0,3,5,9,12], target: 2 },  expected: -1, explanation: '2 not in array' },
    { id: 3, input: { nums: [5],              target: 5 },  expected: 0,  explanation: 'Single element found' },
    { id: 4, input: { nums: [5],              target: 3 },  expected: -1, explanation: 'Single element not found' },
    { id: 5, input: { nums: [1,2,3,4,5],      target: 1 },  expected: 0,  explanation: 'First element' },
    { id: 6, input: { nums: [1,2,3,4,5],      target: 5 },  expected: 4,  explanation: 'Last element' },
    { id: 7, input: { nums: [1,3,5,7,9,11],   target: 7 },  expected: 3,  explanation: 'Middle element' },
  ],

  'lru-cache': [
    {
      id: 1,
      input: { capacity: 2, operations: [['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2],['put',4,4],['get',1],['get',3],['get',4]] },
      expected: [1, -1, -1, 3, 4],
      explanation: 'Standard LRU sequence',
    },
    {
      id: 2,
      input: { capacity: 1, operations: [['put',1,1],['put',2,2],['get',1],['get',2]] },
      expected: [-1, 2],
      explanation: 'Capacity 1 evicts immediately',
    },
    {
      id: 3,
      input: { capacity: 2, operations: [['put',1,1],['put',2,2],['get',1],['put',3,3],['get',1],['get',3]] },
      expected: [1, 1, 3],
      explanation: 'Get updates recency',
    },
    {
      id: 4,
      input: { capacity: 3, operations: [['put',1,1],['put',2,2],['put',3,3],['put',4,4],['get',4],['get',3],['get',2],['get',1],['put',5,5],['get',1],['get',2],['get',3],['get',4],['get',5]] },
      expected: [4, 3, 2, -1, -1, 2, 3, -1, 5],
      explanation: 'Larger capacity test',
    },
    {
      id: 5,
      input: { capacity: 2, operations: [['get',2],['put',2,6],['get',1],['put',1,5],['put',1,2],['get',1],['get',2]] },
      expected: [-1, -1, 2, 6],
      explanation: 'Update existing key',
    },
    {
      id: 6,
      input: { capacity: 10, operations: [['put',10,13],['put',3,17],['put',6,11],['put',10,5],['put',9,10],['get',13],['put',2,19],['get',2],['get',3],['put',5,25]] },
      expected: [-1, 19, 17],
      explanation: 'Complex sequence with capacity 10',
    },
    {
      id: 7,
      input: { capacity: 2, operations: [['put',2,1],['put',1,1],['put',2,3],['put',4,1],['get',1],['get',2]] },
      expected: [-1, 3],
      explanation: 'Update + eviction combo',
    },
  ],
};

/**
 * Run a single test case for a given problem using user-provided JS code.
 * Returns { passed, output, expected, error }
 */
export function runTestCase(problemId, testCase, userCode) {
  try {
    // Build the runner depending on problem
    let result;
    const fn = new Function(userCode + '\nreturn typeof twoSum !== "undefined" ? twoSum : typeof isValid !== "undefined" ? isValid : typeof lengthOfLongestSubstring !== "undefined" ? lengthOfLongestSubstring : typeof merge !== "undefined" ? merge : typeof search !== "undefined" ? search : null;')();

    if (!fn) {
      return { passed: false, output: null, expected: testCase.expected, error: 'Could not find the function. Make sure you define the correct function name.' };
    }

    switch (problemId) {
      case 'two-sum':
        result = fn(testCase.input.nums, testCase.input.target);
        break;
      case 'valid-parentheses':
        result = fn(testCase.input.s);
        break;
      case 'longest-substring':
        result = fn(testCase.input.s);
        break;
      case 'merge-intervals':
        result = fn(testCase.input.intervals.map(a => [...a]));
        break;
      case 'binary-search':
        result = fn(testCase.input.nums, testCase.input.target);
        break;
      case 'lru-cache': {
        // LRU Cache: expects a class `LRUCache`
        const LRUClass = new Function(userCode + '\nreturn typeof LRUCache !== "undefined" ? LRUCache : null;')();
        if (!LRUClass) return { passed: false, output: null, expected: testCase.expected, error: 'Define an LRUCache class.' };
        const cache = new LRUClass(testCase.input.capacity);
        const outputs = [];
        for (const op of testCase.input.operations) {
          if (op[0] === 'put') cache.put(op[1], op[2]);
          else outputs.push(cache.get(op[1]));
        }
        result = outputs;
        break;
      }
      default:
        return { passed: false, output: null, expected: testCase.expected, error: 'Unknown problem.' };
    }

    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    return { passed, output: result, expected: testCase.expected, error: null };
  } catch (err) {
    return { passed: false, output: null, expected: testCase.expected, error: err.message };
  }
}

/** Starter templates per language */
export const STARTER_CODE = {
  'two-sum': {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your code here
};`,
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`,
    c: `#include <stdio.h>
#include <stdlib.h>
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    *returnSize = 2;
    int* result = malloc(2 * sizeof(int));
    return result;
}`,
  },
  'valid-parentheses': {
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Your code here
};`,
    python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
    cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
    }
};`,
    java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
    }
}`,
    c: `#include <stdio.h>
#include <stdbool.h>
bool isValid(char* s) {
    // Your code here
    return false;
}`,
  },
  'longest-substring': {
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Your code here
};`,
    python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your code here
        pass`,
    cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your code here
    }
};`,
    java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your code here
    }
}`,
    c: `#include <stdio.h>
int lengthOfLongestSubstring(char* s) {
    // Your code here
    return 0;
}`,
  },
  'merge-intervals': {
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
  // Your code here
};`,
    python: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        # Your code here
        pass`,
    cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Your code here
    }
};`,
    java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Your code here
    }
}`,
    c: `#include <stdio.h>
#include <stdlib.h>
int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    // Your code here
    return NULL;
}`,
  },
  'binary-search': {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Your code here
};`,
    python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Your code here
        pass`,
    cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Your code here
    }
};`,
    java: `class Solution {
    public int search(int[] nums, int target) {
        // Your code here
    }
}`,
    c: `#include <stdio.h>
int search(int* nums, int numsSize, int target) {
    // Your code here
    return -1;
}`,
  },
  'lru-cache': {
    javascript: `/**
 * @param {number} capacity
 */
class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  /** @param {number} key @return {number} */
  get(key) {
    // Your code here
  }

  /** @param {number} key @param {number} value @return {void} */
  put(key, value) {
    // Your code here
  }
}`,
    python: `class LRUCache:
    def __init__(self, capacity: int):
        # Your code here
        pass
    
    def get(self, key: int) -> int:
        # Your code here
        pass
    
    def put(self, key: int, value: int) -> None:
        # Your code here
        pass`,
    cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
    }
    
    int get(int key) {
    }
    
    void put(int key, int value) {
    }
};`,
    java: `class LRUCache {
    public LRUCache(int capacity) {
    }
    
    public int get(int key) {
    }
    
    public void put(int key, int value) {
    }
}`,
    c: `/* C does not have built-in OOP.
 * Use a struct-based approach or implement manually.
 */
// Your LRU Cache implementation in C here`,
  },
};
