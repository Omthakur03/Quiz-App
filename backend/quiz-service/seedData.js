export const INITIAL_QUESTION_POOL = [
  {
    question_id: "q_docker_001",
    category: "Docker & Containers",
    question: "Which Docker command is used to remove all stopped containers, unused networks, and dangling images at once?",
    options: [
      "docker container clean",
      "docker system prune",
      "docker rm -f --all",
      "docker purge --everything"
    ],
    correct_option: 1,
    explanation: "'docker system prune' removes all stopped containers, unused networks, dangling images, and build caches.",
    difficulty: "Beginner"
  },
  {
    question_id: "q_k8s_001",
    category: "Kubernetes",
    question: "In Kubernetes, which controller object ensures that a specified number of pod replicas are running across nodes at any given time?",
    options: [
      "ReplicaSet",
      "IngressController",
      "DaemonSet",
      "ConfigMap"
    ],
    correct_option: 0,
    explanation: "A ReplicaSet ensures that a specified number of pod replicas are running at any given time.",
    difficulty: "Intermediate"
  },
  {
    question_id: "q_cicd_001",
    category: "CI/CD Pipelines",
    question: "What is the primary role of a 'Stage' in a continuous integration/continuous delivery (CI/CD) pipeline?",
    options: [
      "To hold all source code repositories in one place",
      "To group related jobs or tasks (e.g., Build, Test, Deploy) together in a logical sequence",
      "To manage cloud server hardware provisioning directly",
      "To act as a database cache for build artifacts"
    ],
    correct_option: 1,
    explanation: "Stages group logically related build, test, or deployment tasks into steps that execute sequentially or in parallel.",
    difficulty: "Beginner"
  },
  {
    question_id: "q_iac_001",
    category: "Infrastructure as Code",
    question: "In Terraform, which command checks your configuration code syntax and consistency without modifying real infrastructure?",
    options: [
      "terraform apply --dry-run",
      "terraform validate",
      "terraform inspect",
      "terraform verify"
    ],
    correct_option: 1,
    explanation: "'terraform validate' checks whether a configuration is syntactically valid and internally consistent.",
    difficulty: "Intermediate"
  },
  {
    question_id: "q_linux_001",
    category: "Linux & Networking",
    question: "Which Linux command displays active TCP/UDP connections, listening ports, and routing tables?",
    options: [
      "ss (or netstat)",
      "top",
      "traceroute",
      "chmod"
    ],
    correct_option: 0,
    explanation: "'ss' (socket statistics) or 'netstat' is used to investigate socket connections, listening ports, and routing statistics.",
    difficulty: "Beginner"
  },
  {
    question_id: "q_k8s_002",
    category: "Kubernetes",
    question: "Which Kubernetes resource object allows you to store sensitive data like API keys, passwords, and SSH keys securely?",
    options: [
      "ConfigMap",
      "Secret",
      "VolumeClaim",
      "ServiceAccount"
    ],
    correct_option: 1,
    explanation: "Kubernetes Secrets let you store and manage sensitive information such as passwords, OAuth tokens, and SSH keys.",
    difficulty: "Intermediate"
  },
  {
    question_id: "q_cloud_001",
    category: "Cloud Architecture",
    question: "What is the main advantage of implementing a Blue-Green deployment strategy?",
    options: [
      "It requires 50% less hardware during deployments",
      "It allows zero-downtime deployments and instant rollback if issues arise",
      "It eliminates the need for containerized applications",
      "It automatically encrypts all database transactions"
    ],
    correct_option: 1,
    explanation: "Blue-Green deployment maintains two identical environments, enabling instant traffic switching for zero downtime and rapid rollbacks.",
    difficulty: "Advanced"
  },
  {
    question_id: "q_git_001",
    category: "Git & Version Control",
    question: "Which Git command is used to combine multiple commits into a single commit to clean up commit history before merging?",
    options: [
      "git merge --squash or interactive rebase (git rebase -i)",
      "git checkout --combine",
      "git push --force-with-lease",
      "git cherry-pick --all"
    ],
    correct_option: 0,
    explanation: "Interactive rebase ('git rebase -i') or 'git merge --squash' condenses multiple commits into one single commit.",
    difficulty: "Intermediate"
  },
  {
    question_id: "q_mon_001",
    category: "Monitoring & Observability",
    question: "In Prometheus architecture, how are metrics typically collected from target applications and services?",
    options: [
      "Applications push metrics to a centralized MySQL database",
      "Prometheus pulls (scrapes) HTTP metrics endpoints exposed by targets",
      "Prometheus scans log files stored on disk via FTP",
      "Targets send UDP packets on every function execution"
    ],
    correct_option: 1,
    explanation: "Prometheus uses a pull model, periodically scraping HTTP metrics endpoints (e.g. /metrics) exposed by target services.",
    difficulty: "Intermediate"
  },
  {
    question_id: "q_docker_002",
    category: "Docker & Containers",
    question: "What is the key benefit of multi-stage Docker builds?",
    options: [
      "They allow containers to run on Windows and Linux simultaneously",
      "They help drastically reduce final image size by keeping build tools out of production images",
      "They run containers across multiple cloud providers automatically",
      "They compress container logs using GZIP"
    ],
    correct_option: 1,
    explanation: "Multi-stage builds allow you to build artifacts in heavy staging containers and copy only the runtime binaries into lightweight final images.",
    difficulty: "Advanced"
  }
];
