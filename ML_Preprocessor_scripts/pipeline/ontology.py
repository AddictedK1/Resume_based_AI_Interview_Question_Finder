# ontology.py

SKILL_ONTOLOGY = {
    "java":              ["OOP", "JVM", "multithreading", "collections", "DSA", "SOLID"],
    "python":            ["OOP", "data structures", "scripting", "list comprehension"],
    "c++":               ["OOP", "pointers", "memory management", "STL", "DSA"],
    "javascript":        ["DOM", "async", "promises", "ES6", "closures"],
    "react":             ["JavaScript", "hooks", "state management", "component lifecycle", "virtual DOM"],
    "node.js":           ["JavaScript", "REST API", "event loop", "async", "npm"],
    "express":           ["REST API", "middleware", "routing", "Node.js"],
    "mongodb":           ["NoSQL", "document store", "aggregation", "indexing"],
    "mysql":             ["SQL", "joins", "normalization", "indexing", "ACID", "DBMS"],
    "postgresql":        ["SQL", "joins", "indexing", "ACID", "DBMS"],
    "machine learning":  ["supervised learning", "unsupervised learning", "overfitting", "bias variance"],
    "deep learning":     ["machine learning", "neural networks", "backpropagation", "gradient descent"],
    "pytorch":           ["deep learning", "tensors", "autograd", "neural networks"],
    "tensorflow":        ["deep learning", "neural networks", "keras", "model training"],
    "docker":            ["containerization", "DevOps", "microservices", "virtualization"],
    "git":               ["version control", "branching", "merging", "collaboration"],
    "system design":     ["scalability", "load balancing", "caching", "CAP theorem", "databases"],
    "data structures":   ["arrays", "linked lists", "trees", "graphs", "stacks", "queues", "hashing"],
    "algorithms":        ["sorting", "searching", "dynamic programming", "recursion", "complexity"],
    "operating system":  ["processes", "threads", "memory management", "scheduling", "deadlocks"],
    "computer networks": ["TCP/IP", "HTTP", "DNS", "sockets", "OSI model"],
    "flask":             ["REST API", "Python", "routing", "web framework"],
    "spring boot":       ["Java", "REST API", "dependency injection", "microservices"],
    "aws":               ["cloud computing", "EC2", "S3", "DevOps", "scalability"],
    "linux":             ["OS", "shell scripting", "file system", "processes"],
}

def expand_skills(skills: list[str]) -> list[str]:
    expanded = set(skills)
    for skill in skills:
        key = skill.lower().strip()
        if key in SKILL_ONTOLOGY:
            expanded.update(SKILL_ONTOLOGY[key])
    return list(expanded)