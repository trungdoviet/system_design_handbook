import json
from database import SessionLocal, Quest

def seed_dsa():
    db = SessionLocal()
    try:
        # Delete existing DSA questions
        print("Clearing old DSA questions...")
        db.query(Quest).filter(Quest.topic_id == "dsa").delete()
        db.commit()

        dsa_quests = [
            {
                "topic_id": "dsa",
                "title": "Two Sum",
                "category": "Two Pointers",
                "scenario": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n### Constraints:\n- `2 <= nums.length <= 10^4`\n- `-10^9 <= nums[i] <= 10^9`\n- `-10^9 <= target <= 10^9`\n\n### Examples:\n- **Input**: `nums = [2,7,11,15]`, `target = 9`\n- **Output**: `[0,1]` (Because `nums[0] + nums[1] == 9`)",
                "options": {
                    "is_coding": True,
                    "func_name": "twoSum",
                    "templates": {
                        "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write Python code here\n        pass",
                        "java": "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write Java code here\n        return new int[0];\n    }\n}"
                    },
                    "test_cases": [
                        {"input": "([2, 7, 11, 15], 9)", "output": "[0, 1]"},
                        {"input": "([3, 2, 4], 6)", "output": "[1, 2]"},
                        {"input": "([3, 3], 6)", "output": "[0, 1]"}
                    ],
                    "java_driver": "import java.util.Arrays;\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"{\\\"passed\\\": \");\n        \n        int[] r1 = sol.twoSum(new int[]{2, 7, 11, 15}, 9);\n        boolean t1 = r1 != null && r1.length == 2 && ((r1[0] == 0 && r1[1] == 1) || (r1[0] == 1 && r1[1] == 0));\n        \n        int[] r2 = sol.twoSum(new int[]{3, 2, 4}, 6);\n        boolean t2 = r2 != null && r2.length == 2 && ((r2[0] == 1 && r2[1] == 2) || (r2[0] == 2 && r2[1] == 1));\n        \n        boolean all = t1 && t2;\n        sb.append(all).append(\", \\\"details\\\": [\");\n        sb.append(\"{\\\"test_case\\\": 1, \\\"status\\\": \\\"\").append(t1 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[2,7,11,15], 9\\\", \\\"expected\\\": \\\"[0,1]\\\", \\\"actual\\\": \\\"\").append(Arrays.toString(r1)).append(\"\\\"}\");\n        sb.append(\", {\\\"test_case\\\": 2, \\\"status\\\": \\\"\").append(t2 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[3,2,4], 6\\\", \\\"expected\\\": \\\"[1,2]\\\", \\\"actual\\\": \\\"\").append(Arrays.toString(r2)).append(\"\\\"}\");\n        sb.append(\"]}\");\n        \n        System.out.println(sb.toString());\n    }\n}"
                },
                "correct_answer": "CODING",
                "explanations": {
                    "A": "HashMap solution runs in O(N) time and O(N) space. We store visited numbers and their index keys.",
                    "B": "Two-pointer approach works on sorted arrays. If input is unsorted, we must track original index values.",
                    "C": "Brute force runs in O(N^2) time using nested loops.",
                    "D": "Fastest lookups are achieved by hash lookups."
                }
            },
            {
                "topic_id": "dsa",
                "title": "Best Time to Buy and Sell Stock",
                "category": "Sliding Window",
                "scenario": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.\n\n### Constraints:\n- `1 <= prices.length <= 10^5`\n- `0 <= prices[i] <= 10^4`\n\n### Examples:\n- **Input**: `prices = [7,1,5,3,6,4]`\n- **Output**: `5` (Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5)",
                "options": {
                    "is_coding": True,
                    "func_name": "maxProfit",
                    "templates": {
                        "python": "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write Python code here\n        pass",
                        "java": "public class Solution {\n    public int maxProfit(int[] prices) {\n        // Write Java code here\n        return 0;\n    }\n}"
                    },
                    "test_cases": [
                        {"input": "([7, 1, 5, 3, 6, 4],)", "output": "5"},
                        {"input": "([7, 6, 4, 3, 1],)", "output": "0"},
                        {"input": "([1, 2],)", "output": "1"}
                    ],
                    "java_driver": "public class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"{\\\"passed\\\": \");\n        \n        int r1 = sol.maxProfit(new int[]{7, 1, 5, 3, 6, 4});\n        boolean t1 = r1 == 5;\n        \n        int r2 = sol.maxProfit(new int[]{7, 6, 4, 3, 1});\n        boolean t2 = r2 == 0;\n        \n        boolean all = t1 && t2;\n        sb.append(all).append(\", \\\"details\\\": [\");\n        sb.append(\"{\\\"test_case\\\": 1, \\\"status\\\": \\\"\").append(t1 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[7,1,5,3,6,4]\\\", \\\"expected\\\": \\\"5\\\", \\\"actual\\\": \\\"\").append(r1).append(\"\\\"}\");\n        sb.append(\", {\\\"test_case\\\": 2, \\\"status\\\": \\\"\").append(t2 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[7,6,4,3,1]\\\", \\\"expected\\\": \\\"0\\\", \\\"actual\\\": \\\"\").append(r2).append(\"\\\"}\");\n        sb.append(\"]}\");\n        \n        System.out.println(sb.toString());\n    }\n}"
                },
                "correct_answer": "CODING",
                "explanations": {
                    "A": "Greedy one-pass tracks min price and updates max profit at each step. O(N) time and O(1) space.",
                    "B": "Two pointer sliding window tracks buy (left) and sell (right) pointers.",
                    "C": "Brute force checks all pairs in O(N^2) time.",
                    "D": "Stack approaches are unnecessary for single purchase transactions."
                }
            },
            {
                "topic_id": "dsa",
                "title": "Valid Parentheses",
                "category": "Stacks & Queues",
                "scenario": "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\n### Constraints:\n- `1 <= s.length <= 10^4`\n- `s` consists of parentheses only.\n\n### Examples:\n- **Input**: `s = \"()[]{}\"`\n- **Output**: `true`\n- **Input**: `s = \"(]\"`\n- **Output**: `false`",
                "options": {
                    "is_coding": True,
                    "func_name": "isValid",
                    "templates": {
                        "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write Python code here\n        pass",
                        "java": "public class Solution {\n    public boolean isValid(String s) {\n        // Write Java code here\n        return false;\n    }\n}"
                    },
                    "test_cases": [
                        {"input": "(\"(]\",)", "output": "False"},
                        {"input": "(\"()[]{}\",)", "output": "True"},
                        {"input": "(\"{[]}\",)", "output": "True"}
                    ],
                    "java_driver": "public class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"{\\\"passed\\\": \");\n        \n        boolean r1 = sol.isValid(\"()[]{}\");\n        boolean t1 = r1 == true;\n        \n        boolean r2 = sol.isValid(\"(]\");\n        boolean t2 = r2 == false;\n        \n        boolean all = t1 && t2;\n        sb.append(all).append(\", \\\"details\\\": [\");\n        sb.append(\"{\\\"test_case\\\": 1, \\\"status\\\": \\\"\").append(t1 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"()[]{}\\\", \\\"expected\\\": \\\"true\\\", \\\"actual\\\": \\\"\").append(r1).append(\"\\\"}\");\n        sb.append(\", {\\\"test_case\\\": 2, \\\"status\\\": \\\"\").append(t2 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"(]\\\", \\\"expected\\\": \\\"false\\\", \\\"actual\\\": \\\"\").append(r2).append(\"\\\"}\");\n        sb.append(\"]}\");\n        \n        System.out.println(sb.toString());\n    }\n}"
                },
                "correct_answer": "CODING",
                "explanations": {
                    "A": "Stack (LIFO) is the optimal structure. Open brackets are pushed; close brackets are popped and validated.",
                    "B": "O(N) time and O(N) space where N is string length.",
                    "C": "Queues fail to validate nesting correctly.",
                    "D": "Recursive regex strings are slow and error-prone."
                }
            },
            {
                "topic_id": "dsa",
                "title": "Maximum Subarray",
                "category": "Dynamic Programming",
                "scenario": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n### Constraints:\n- `1 <= nums.length <= 10^5`\n- `-10^4 <= nums[i] <= 10^4`\n\n### Examples:\n- **Input**: `nums = [-2,1,-3,4,-1,2,1,-5,4]`\n- **Output**: `6` (Subarray `[4,-1,2,1]` has the largest sum = 6)",
                "options": {
                    "is_coding": True,
                    "func_name": "maxSubArray",
                    "templates": {
                        "python": "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write Python code here\n        pass",
                        "java": "public class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write Java code here\n        return 0;\n    }\n}"
                    },
                    "test_cases": [
                        {"input": "([-2, 1, -3, 4, -1, 2, 1, -5, 4],)", "output": "6"},
                        {"input": "([1],)", "output": "1"},
                        {"input": "([5, 4, -1, 7, 8],)", "output": "23"}
                    ],
                    "java_driver": "public class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"{\\\"passed\\\": \");\n        \n        int r1 = sol.maxSubArray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4});\n        boolean t1 = r1 == 6;\n        \n        int r2 = sol.maxSubArray(new int[]{5, 4, -1, 7, 8});\n        boolean t2 = r2 == 23;\n        \n        boolean all = t1 && t2;\n        sb.append(all).append(\", \\\"details\\\": [\");\n        sb.append(\"{\\\"test_case\\\": 1, \\\"status\\\": \\\"\").append(t1 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[-2,1,-3,4,-1,2,1,-5,4]\\\", \\\"expected\\\": \\\"6\\\", \\\"actual\\\": \\\"\").append(r1).append(\"\\\"}\");\n        sb.append(\", {\\\"test_case\\\": 2, \\\"status\\\": \\\"\").append(t2 ? \"passed\" : \"failed\").append(\"\\\", \\\"input\\\": \\\"[5,4,-1,7,8]\\\", \\\"expected\\\": \\\"23\\\", \\\"actual\\\": \\\"\").append(r2).append(\"\\\"}\");\n        sb.append(\"]}\");\n        \n        System.out.println(sb.toString());\n    }\n}"
                },
                "correct_answer": "CODING",
                "explanations": {
                    "A": "Kadane's Algorithm maintains standard cumulative running sum. If sum falls below zero, reset it.",
                    "B": "O(N) time and O(1) space.",
                    "C": "Divide and conquer approaches run in O(N log N) time.",
                    "D": "Nested loops brute force runs in O(N^2) time."
                }
            }
        ]

        for q_data in dsa_quests:
            quest = Quest(
                topic_id=q_data["topic_id"],
                title=q_data["title"],
                category=q_data["category"],
                scenario=q_data["scenario"],
                options=json.dumps(q_data["options"], ensure_ascii=False),
                correct_answer=q_data["correct_answer"],
                explanations=json.dumps(q_data["explanations"], ensure_ascii=False),
                status="published",
                author_id=None
            )
            db.add(quest)
        db.commit()
        print("Successfully seeded interactive DSA coding questions!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_dsa()
