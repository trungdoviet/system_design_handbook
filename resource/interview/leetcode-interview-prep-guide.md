# LeetCode Interview Preparation Guide (Java Master Edition)

## 1. Core Mindset & Interview Strategy

Before diving into code, understand that interviewers evaluate your **problem-solving process**, not just the final answer.

### 1.1 The 5-Minute Rule
-   **Minutes 0-2:** Clarify the problem. Ask about edge cases, constraints, input format. Never start coding immediately.
-   **Minutes 2-4:** Think out loud. Propose a brute force approach first, then optimize. Silence is a red flag.
-   **Minutes 4-5:** Dry-run your algorithm on a simple example before writing code.

### 1.2 During the Interview: Step-by-Step Framework
1.  **Read & Clarify (2-3 mins):** Restate problem, ask about constraints/edge cases.
2.  **Examples & Brute Force (3-5 mins):** Walk through 2-3 examples. State naive approach + complexity.
3.  **Optimize (5-7 mins):** Identify bottleneck. Propose better approach. Get interviewer buy-in.
4.  **Code (10-15 mins):** Write clean, modular code. Use meaningful variable names.
5.  **Test & Debug (5 mins):** Trace through examples. Fix bugs verbally.
6.  **Complexity Analysis (2 mins):** State time/space clearly. Explain trade-offs.

### 1.3 Key Phrases to Use
-   "I'm thinking out loud here..."
-   "Let me consider the edge cases..."
-   "This is O(n) time because..."
-   "I'm trading space for time here..."
-   "We could also solve this using [alternative], but I chose this because..."

---

## 2. Essential Java Toolkit for Interviews

Master these Java-specific patterns to save critical time during interviews.

### 2.1 Data Structure Shortcuts

```java
// HashMap with default value (avoids null checks)
Map<Character, Integer> freq = new HashMap<>();
freq.merge(c, 1, Integer::sum); // Increment or initialize to 1

// PriorityQueue as Max Heap (default is Min Heap)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// TreeSet for sorted unique elements + O(log n) ceiling/floor
TreeSet<Integer> set = new TreeSet<>();
set.ceiling(x); // Smallest element >= x
set.floor(x);   // Largest element <= x

// Deque as Stack/Queue (Faster than legacy Stack class)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.pop();

// StringBuilder for string manipulation (Strings are immutable!)
StringBuilder sb = new StringBuilder();
sb.append("hello").reverse().toString();

// Iteration over Map
for (Map.Entry<Integer, String> entry : map.entrySet()) {
    int key = entry.getKey();
    String value = entry.getValue();
}
```

### 2.2 Array & Matrix Tricks

```java
// Sort by custom criteria
Arrays.sort(arr, (a, b) -> Integer.compare(b, a)); // Descending

// Binary Search on sorted array
int idx = Arrays.binarySearch(arr, target);

// Fill 2D array
int[][] dp = new int[m][n];
for (int[] row : dp) Arrays.fill(row, -1);

// Convert List to Array
int[] arr = list.stream().mapToInt(Integer::intValue).toArray();

// Avoid overflow in binary search mid calculation
int mid = left + (right - left) / 2; 
```

### 2.3 Useful Built-in Methods
```java
// String
s.charAt(i); s.toCharArray(); s.substring(start, end); // end exclusive
String.valueOf(x); // int to string

// Math
Math.max(a, b); Math.min(a, b); Math.abs(x); 

// Collections
Collections.sort(list); Collections.reverse(list); Collections.swap(list, i, j);

// Integer
Integer.parseInt(s); Integer.MAX_VALUE; Integer.MIN_VALUE;
```

---

## 3. Must-Know Data Structures (with Java Usage)

### 3.1 HashMap / HashSet
```java
Map<Integer, String> map = new HashMap<>();
map.put(key, value);
map.getOrDefault(key, defaultVal);
map.containsKey(key);

Set<Integer> set = new HashSet<>();
set.add(x); set.contains(x); // O(1)
```
**Common Patterns:** Two Sum (`containsKey(target - num)`), Contains Duplicate (`add` returns false), Group Anagrams, Frequency counting.

### 3.2 Stack & Queue (Deque)
```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(x); stack.pop(); stack.peek();

Deque<Integer> queue = new ArrayDeque<>();
queue.offer(x); queue.poll(); queue.peek();
```
**Patterns:** Valid Parentheses, Monotonic Stack (next greater element), BFS traversal.

### 3.3 PriorityQueue (Heap)
```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);

minHeap.offer(x); minHeap.poll(); minHeap.peek();
```
**Patterns:** Top K elements, Kth largest, Merge K sorted lists.

### 3.4 LinkedList
```java
class ListNode {
    int val; ListNode next;
    ListNode(int val) { this.val = val; }
}

// Dummy head pattern (essential!)
ListNode dummy = new ListNode(0);
ListNode curr = dummy;
return dummy.next;
```
**Patterns:** Fast & slow pointers (cycle detection, middle), Reverse linked list, Merge two sorted lists.

### 3.5 Tree (Binary Tree)
```java
class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode(int val) { this.val = val; }
}

// BFS (Level Order)
Queue<TreeNode> queue = new LinkedList<>();
queue.offer(root);
while (!queue.isEmpty()) {
    int size = queue.size();
    for (int i = 0; i < size; i++) {
        TreeNode node = queue.poll();
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
}

// DFS Preorder
void preorder(TreeNode root) {
    if (root == null) return;
    preorder(root.left);
    preorder(root.right);
}
```

### 3.6 Graph
```java
Map<Integer, List<Integer>> graph = new HashMap<>();
for (int[] edge : edges) {
    graph.computeIfAbsent(edge[0], k -> new ArrayList<>()).add(edge[1]);
}

// Union-Find (Disjoint Set Union)
class UnionFind {
    int[] parent, rank;
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;
        if (rank[px] < rank[py]) parent[px] = py;
        else if (rank[px] > rank[py]) parent[py] = px;
        else { parent[py] = px; rank[px]++; }
    }
}
```

---

## 4. Must-Know Algorithm Patterns & Templates

Focus on these high-frequency patterns rather than memorizing individual problems.

### 4.1 Two Pointers
```java
// Sorted array, find pair with target sum
int left = 0, right = nums.length - 1;
while (left < right) {
    int sum = nums[left] + nums[right];
    if (sum == target) return new int[]{left, right};
    else if (sum < target) left++;
    else right--;
}
```

### 4.2 Sliding Window
```java
// Longest substring without repeating characters
int left = 0, maxLen = 0;
Map<Character, Integer> window = new HashMap<>();
for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    window.merge(c, 1, Integer::sum);
    
    while (window.get(c) > 1) {
        window.merge(s.charAt(left), -1, Integer::sum);
        left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
}
```

### 4.3 Binary Search
```java
int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### 4.4 Backtracking
```java
void backtrack(List<Integer> current, int start, int[] nums, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);
        backtrack(current, i + 1, nums, result);
        current.remove(current.size() - 1);
    }
}
```

### 4.5 Dynamic Programming
```java
// 1D DP (Space Optimized)
int prev2 = 0, prev1 = 1;
for (int i = 2; i <= n; i++) {
    int current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
}

// Kadane's Algorithm (Max Subarray)
int maxSum = nums[0], currentSum = nums[0];
for (int i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
}
```

### 4.6 Graph Traversal Templates
```java
// BFS (Shortest Path / Level Order)
Queue<int[]> queue = new LinkedList<>();
boolean[][] visited = new boolean[m][n];
queue.offer(new int[]{startR, startC});
visited[startR][startC] = true;

while (!queue.isEmpty()) {
    int size = queue.size();
    for (int i = 0; i < size; i++) {
        int[] curr = queue.poll();
        for (int[] dir : dirs) {
            int nr = curr[0] + dir[0], nc = curr[1] + dir[1];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.offer(new int[]{nr, nc});
            }
        }
    }
}

// Kahn's Algorithm (Topological Sort)
List<Integer> topologicalSort(int n, int[][] edges) {
    List<Integer>[] graph = new List[n];
    int[] indegree = new int[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
    for (int[] e : edges) { graph[e[0]].add(e[1]); indegree[e[1]]++; }
    
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.offer(i);
    
    List<Integer> result = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll(); result.add(node);
        for (int neighbor : graph[node]) if (--indegree[neighbor] == 0) queue.offer(neighbor);
    }
    return result.size() == n ? result : new ArrayList<>();
}
```

---

## 5. Problem Categories Cheat Sheet

| Category | Pattern | Keywords | Java Tools |
| :--- | :--- | :--- | :--- |
| **Array/String** | Two Sum, Sliding Window, Prefix Sum, Kadane's | "subarray", "substring", "sum equals" | HashMap, Deque, int[] |
| **Linked List** | Reverse, Cycle Detection, Merge | "reverse", "cycle", "merge sorted" | Dummy Head, Fast/Slow Ptrs |
| **Tree** | BFS Level Order, DFS, Validate BST, LCA | "level order", "depth", "path sum" | Queue, Recursion |
| **Graph** | BFS Shortest Path, DFS Islands, Topo Sort | "shortest path", "islands", "prerequisites" | Adjacency List, UnionFind |
| **DP** | 1D/2D DP, Knapsack, LCS | "minimum", "maximum", "ways" | int[], int[][] |
| **Heap** | Top K, Kth Largest, Merge K Lists | "kth", "top k", "merge" | PriorityQueue |

---

## 6. Common Pitfalls & Edge Cases

### 6.1 Performance Traps
-   ❌ Using `LinkedList` for random access → O(n). Use `ArrayList`.
-   ❌ String concatenation in loops → O(n²). Use `StringBuilder`.
-   ❌ Using legacy `Stack` class. Use `ArrayDeque`.
-   ❌ Creating objects inside tight loops. Reuse or use primitives.

### 6.2 Logic Errors
-   Off-by-one in binary search: Be consistent with `left <= right` vs `left < right`.
-   Forgetting to mark visited in BFS/DFS → Infinite loops.
-   Modifying collection while iterating → `ConcurrentModificationException`.
-   Integer overflow: Use `long` for sums/products of large inputs.

### 6.3 Edge Cases Checklist
Always verify: Empty input (null, length 0), Single element, All same elements,
Negative numbers, Duplicate values, Maximum/minimum constraint values.

---

## 7. Time Complexity Cheat Sheet

| Data Structure | Access | Search | Insert | Delete |
| :--- | :--- | :--- | :--- | :--- |
| ArrayList | O(1) | O(n) | O(1)* | O(n) |
| HashMap/HashSet | N/A | O(1) | O(1) | O(1) |
| TreeMap/TreeSet | N/A | O(log n) | O(log n) | O(log n) |
| Stack/Queue (Deque) | O(1) | O(n) | O(1) | O(1) |
| PriorityQueue | O(1) peek | O(n) | O(log n) | O(log n) |

*Amortized

---

## 8. Top 20 Most Frequently Asked Problems

### 8.1 Two Sum (#1) - HashMap
Pattern: HashMap lookup | Time: O(n) | Space: O(n)
Approach: For each number, check if complement exists in map.
```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement))
            return new int[]{map.get(complement), i};
        map.put(nums[i], i);
    }
    return new int[0];
}
```

### 8.2 Maximum Subarray (#53) - Kadane's DP
Pattern: Dynamic Programming | Time: O(n) | Space: O(1)
Approach: Track current sum, reset if negative.
```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0], currSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currSum = Math.max(nums[i], currSum + nums[i]);
        maxSum = Math.max(maxSum, currSum);
    }
    return maxSum;
}
```

### 8.3 Best Time to Buy/Sell Stock (#121)
Pattern: One Pass | Time: O(n) | Space: O(1)
Approach: Track min price, calculate max profit.
```java
public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        minPrice = Math.min(minPrice, price);
        maxProfit = Math.max(maxProfit, price - minPrice);
    }
    return maxProfit;
}
```

### 8.4 Valid Parentheses (#20) - Stack
Pattern: Stack | Time: O(n) | Space: O(n)
Approach: Push opening brackets, match closing.
```java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> map = Map.of(')', '(', '}', '{', ']', '[');
    for (char c : s.toCharArray()) {
        if (map.containsValue(c)) stack.push(c);
        else if (stack.isEmpty() || stack.pop() != map.get(c)) return false;
    }
    return stack.isEmpty();
}
```

### 8.5 Merge Two Sorted Lists (#21)
Pattern: Two Pointers | Time: O(n) | Space: O(1)
Approach: Compare nodes, link smaller one.
```java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), curr = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
        else { curr.next = l2; l2 = l2.next; }
        curr = curr.next;
    }
    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

### 8.6 Reverse Linked List (#206)
Pattern: Iterative | Time: O(n) | Space: O(1)
Approach: Reverse pointers while traversing.
```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
```

### 8.7 Binary Tree Inorder (#94)
Pattern: Stack/Recursion | Time: O(n) | Space: O(n)
Approach: Left, root, right traversal order.
```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        result.add(curr.val);
        curr = curr.right;
    }
    return result;
}
```

### 8.8 Maximum Depth Binary Tree (#104)
Pattern: DFS Recursion | Time: O(n) | Space: O(h)
Approach: Max depth of left/right subtrees + 1.
```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### 8.9 Two Sum II (#167) - Sorted Array
Pattern: Two Pointers | Time: O(n) | Space: O(1)
Approach: Start from both ends, move inward.
```java
public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) return new int[]{left + 1, right + 1};
        else if (sum < target) left++;
        else right--;
    }
    return new int[0];
}
```

### 8.10 Number of Islands (#200)
Pattern: BFS/DFS Matrix | Time: O(m*n) | Space: O(m*n)
Approach: Mark visited cells, count components.
```java
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++)
        for (int j = 0; j < grid[0].length; j++)
            if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
    return count;
}
void dfs(char[][] g, int r, int c) {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';
    dfs(g, r+1, c); dfs(g, r-1, c); dfs(g, r, c+1); dfs(g, r, c-1);
}
```

### 8.11 House Robber (#198) - DP
Pattern: Dynamic Programming | Time: O(n) | Space: O(1)
Approach: Max of rob current+skip or skip current.
```java
public int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int num : nums) {
        int curr = Math.max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

### 8.12 Longest Palindromic Substring (#5)
Pattern: Expand Around Center | Time: O(n^2) | Space: O(1)
Approach: Check odd/even length palindromes.
```java
public String longestPalindrome(String s) {
    if (s.isEmpty()) return "";
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        int len1 = expand(s, i, i), len2 = expand(s, i, i + 1);
        int len = Math.max(len1, len2);
        if (len > end - start) {
            start = i - (len - 1) / 2;
            end = i + len / 2;
        }
    }
    return s.substring(start, end + 1);
}
int expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return r - l - 1;
}
```

### 8.13 Container With Most Water (#11)
Pattern: Two Pointers | Time: O(n) | Space: O(1)
Approach: Move shorter line inward to find max area.
```java
public int maxArea(int[] height) {
    int left = 0, right = height.length - 1, maxArea = 0;
    while (left < right) {
        int area = Math.min(height[left], height[right]) * (right - left);
        maxArea = Math.max(maxArea, area);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxArea;
}
```

### 8.14 3Sum (#15) - Two Pointers + Sort
Pattern: Sorting + Two Pointers | Time: O(n^2) | Space: O(1)
Approach: Fix one element, use two pointers for rest.
```java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                while (left < right && nums[left] == nums[left+1]) left++;
                while (left < right && nums[right] == nums[right-1]) right--;
                left++; right--;
            } else if (sum < 0) left++;
            else right--;
        }
    }
    return result;
}
```

### 8.15 Product of Array Except Self (#238)
Pattern: Two Pass | Time: O(n) | Space: O(1)
Approach: Multiply prefix and suffix products.
```java
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    result[0] = 1;
    for (int i = 1; i < n; i++) result[i] = result[i-1] * nums[i-1];
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}
```

### 8.16 Search in Rotated Sorted Array (#33)
Pattern: Modified Binary Search | Time: O(log n) | Space: O(1)
Approach: Determine which half is sorted, search there.
```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}
```

### 8.17 Merge Intervals (#56)
Pattern: Sort + Linear Scan | Time: O(n log n) | Space: O(n)
Approach: Sort by start, merge overlapping intervals.
```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> result = new ArrayList<>();
    for (int[] interval : intervals) {
        if (result.isEmpty() || result.get(result.size()-1)[1] < interval[0])
            result.add(interval);
        else
            result.get(result.size()-1)[1] = Math.max(
                result.get(result.size()-1)[1], interval[1]);
    }
    return result.toArray(new int[result.size()][]);
}
```

### 8.18 Subtree of Another Tree (#572)
Pattern: DFS Recursion | Time: O(m*n) | Space: O(h)
Approach: Check if trees are identical at each node.
```java
public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    if (root == null) return false;
    if (isSame(root, subRoot)) return true;
    return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
boolean isSame(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null || p.val != q.val) return false;
    return isSame(p.left, q.left) && isSame(p.right, q.right);
}
```

### 8.19 LRU Cache (#146)
Pattern: HashMap + Doubly Linked List | Time: O(1) | Space: O(capacity)
Approach: Use DLL for ordering, HashMap for access.
```java
class LRUCache {
    class Node { int key, val; Node prev, next;
        Node(int k, int v) { key = k; val = v; } }
    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head, tail;
    public LRUCache(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
        head = new Node(0, 0); tail = new Node(0, 0);
        head.next = tail; tail.prev = head;
    }
    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node); addToFront(node);
        return node.val;
    }
    public void put(int key, int value) {
        if (map.containsKey(key)) remove(map.get(key));
        if (map.size() == capacity) remove(tail.prev);
        Node node = new Node(key, value);
        addToFront(node); map.put(key, node);
    }
    void remove(Node node) {
        node.prev.next = node.next; node.next.prev = node.prev;
        map.remove(node.key);
    }
    void addToFront(Node node) {
        node.next = head.next; node.prev = head;
        head.next.prev = node; head.next = node;
        map.put(node.key, node);
    }
}
```

### 8.20 Word Break (#139) - DP
Pattern: Dynamic Programming | Time: O(n^2) | Space: O(n)
Approach: Check if substring can be segmented.
```java
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> set = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;
    for (int i = 1; i <= s.length(); i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && set.contains(s.substring(j, i))) {
                dp[i] = true; break;
            }
    return dp[s.length()];
}
```

---

## 9. Interview Strategy (45-Minute Framework)

### 9.1 Time Allocation by Difficulty
- **Easy Problems:** 15-20 minutes total
- **Medium Problems:** 30-35 minutes total
- **Hard Problems:** 40-45 minutes total

### 9.2 Minute-by-Minute Breakdown (Medium Problem)
- **Minutes 0-2:** Read problem carefully, ask clarifying questions
- **Minutes 2-5:** Think through examples, identify edge cases
- **Minutes 5-10:** Discuss approach with interviewer, get buy-in
- **Minutes 10-25:** Implement solution with clean code
- **Minutes 25-30:** Test with examples, fix any bugs
- **Minutes 30-35:** Optimize if needed, discuss alternatives

### 9.3 When to Optimize vs Just Solve
- Present brute force first if it works within constraints
- Never skip brute force — it shows problem-solving ability
- Optimize only after confirming brute force correctness
- Ask: "Should I optimize further?" before diving deeper

### 9.4 When You're Stuck: Recovery Steps
1. Talk through what you know about the problem
2. Try brute force approach even if inefficient
3. Work through small examples to find patterns
4. Ask for hint gracefully: "Could you give me a direction?"
5. Simplify: Solve easier version first, then generalize

### 9.5 How to Handle Hints Effectively
- Don't implement hints blindly — understand WHY they work
- Say: "That's helpful, let me think how to apply that"
- Connect hint to your current approach
- Show you grasp the underlying concept, not just mechanics

### 9.6 Virtual Interview Best Practices
- Speak clearly and explain your thinking process
- Share screen with code editor visible
- Narrate as you code: "Now I'm creating a HashMap..."
- Never go silent for more than 30 seconds
- Use comments to document your thought process

---

## 10. Mock Interview Simulation Framework

### 10.1 Phase 1: Solo Timed Practice
- Pick a random problem from your study list
- Set timer for appropriate duration (15/30/45 min)
- Solve without looking at solutions or hints
- After timer ends, review optimal solution
- Note gaps in your approach vs ideal solution

### 10.2 Phase 2: Explaining to Imaginary Interviewer
- Talk through your approach aloud while solving
- Practice articulating time/space complexity
- Explain trade-offs between different approaches
- Record yourself to identify unclear explanations
- Focus on clear, structured communication

### 10.3 Phase 3: Partner Mock Interviews
- Find a friend to play interviewer role
- Conduct full 45-minute session with real problem
- Have partner provide feedback on:
  - Communication clarity
  - Code quality and organization
  - Handling of edge cases
  - Response to hints and guidance
- Rotate roles so both practice interviewing

### 10.4 Phase 4: Post-Mock Review
- What went well? Identify strengths to maintain
- What needs improvement? Note specific areas
- Which patterns did you miss recognizing?
- Did you manage time effectively?
- Create action items for next practice session

### 10.5 Self-Rating Rubric
After each mock interview, rate yourself:
- **Problem Solved:** Did you complete working solution in time?
- **Communication:** Was your thinking process clear and logical?
- **Edge Cases:** Did you consider and handle boundary conditions?
- **Optimization:** Did you improve solution when prompted?
- **Code Quality:** Is code clean, readable, and well-structured?

Score each category 1-5. Target average of 4+ before real interviews.

---

## 11. Practice Roadmap

### Phase 1: Foundation (Weeks 1-2)
-   Master arrays, strings, hash maps, two pointers
-   Problems: Two Sum, Valid Anagram, Contains Duplicate, Move Zeroes

### Phase 2: Core Patterns (Weeks 3-4)
-   Sliding window, BFS/DFS, binary search, backtracking
-   Problems: Longest Substring Without Repeating Characters, Number of Islands, Search in Rotated Sorted Array, Permutations

### Phase 3: Advanced (Weeks 5-6)
-   DP, graphs, heaps, tries, union-find
-   Problems: Climbing Stairs, Course Schedule, Merge K Sorted Lists, Word Search II

### Phase 4: Mock Interviews (Ongoing)
-   Time yourself (30-45 mins per problem)
-   Practice explaining aloud
-   Review solutions after solving

---

## 12. Final Tips

-   **Quality > Quantity:** Understand 100 problems deeply vs skimming 500.
-   **Revisit Old Problems:** Spaced repetition beats cramming.
-   **Write Code on Paper/Whiteboard:** Simulates real interview conditions.
-   **Learn Java Collections Internals:** Know when `HashMap` rehashes, how `PriorityQueue` works internally.
-   **Stay Calm:** If stuck, communicate. "I'm thinking about X approach because..." is better than silence.
-   **Consistency over intensity:** 1-2 problems daily > 10 problems on weekends.

> **Remember:** Interviewers want you to succeed. They're looking for structured thinking,
    communication, and coding hygiene — not perfection. Good luck! 🚀