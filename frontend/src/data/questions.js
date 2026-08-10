export const QUESTION_POOL = [
  {
    id: 1,
    category: "Docker & Containers",
    question: "Which Docker command is used to remove all stopped containers, unused networks, and dangling images at once?",
    options: [
      "docker container clean",
      "docker system prune",
      "docker rm -f --all",
      "docker purge --everything"
    ],
    correct: 1,
    explanation: "'docker system prune' removes all stopped containers, unused networks, dangling images, and build caches."
  },
  {
    id: 2,
    category: "Kubernetes",
    question: "In Kubernetes, which controller object ensures that a specified number of pod replicas are running across nodes at any given time?",
    options: [
      "ReplicaSet",
      "IngressController",
      "DaemonSet",
      "ConfigMap"
    ],
    correct: 0,
    explanation: "A ReplicaSet ensures that a specified number of pod replicas are running at any given time."
  },
  {
    id: 3,
    category: "CI/CD Pipelines",
    question: "What is the primary role of a 'Stage' in a continuous integration/continuous delivery (CI/CD) pipeline?",
    options: [
      "To hold all source code repositories in one place",
      "To group related jobs or tasks (e.g., Build, Test, Deploy) together in a logical sequence",
      "To manage cloud server hardware provisioning directly",
      "To act as a database cache for build artifacts"
    ],
    correct: 1,
    explanation: "Stages group logically related build, test, or deployment tasks into steps that execute sequentially or in parallel."
  },
  {
    id: 4,
    category: "Infrastructure as Code",
    question: "In Terraform, which command checks your configuration code syntax and consistency without modifying real infrastructure?",
    options: [
      "terraform apply --dry-run",
      "terraform validate",
      "terraform inspect",
      "terraform verify"
    ],
    correct: 1,
    explanation: "'terraform validate' checks whether a configuration is syntactically valid and internally consistent."
  },
  {
    id: 5,
    category: "Linux & Networking",
    question: "Which Linux command displays active TCP/UDP connections, listening ports, and routing tables?",
    options: [
      "ss (or netstat)",
      "top",
      "traceroute",
      "chmod"
    ],
    correct: 0,
    explanation: "'ss' (socket statistics) or 'netstat' is used to investigate socket connections, listening ports, and routing statistics."
  },
  {
    id: 6,
    category: "Kubernetes",
    question: "Which Kubernetes resource object allows you to store sensitive data like API keys, passwords, and SSH keys securely?",
    options: [
      "ConfigMap",
      "Secret",
      "VolumeClaim",
      "ServiceAccount"
    ],
    correct: 1,
    explanation: "Kubernetes Secrets let you store and manage sensitive information such as passwords, OAuth tokens, and SSH keys."
  },
  {
    id: 7,
    category: "Cloud Architecture",
    question: "What is the main advantage of implementing a Blue-Green deployment strategy?",
    options: [
      "It requires 50% less hardware during deployments",
      "It allows zero-downtime deployments and instant rollback if issues arise",
      "It eliminates the need for containerized applications",
      "It automatically encrypts all database transactions"
    ],
    correct: 1,
    explanation: "Blue-Green deployment maintains two identical environments, enabling instant traffic switching for zero downtime and rapid rollbacks."
  },
  {
    id: 8,
    category: "Git & Version Control",
    question: "Which Git command is used to combine multiple commits into a single commit to clean up commit history before merging?",
    options: [
      "git merge --squash or interactive rebase (git rebase -i)",
      "git checkout --combine",
      "git push --force-with-lease",
      "git cherry-pick --all"
    ],
    correct: 0,
    explanation: "Interactive rebase ('git rebase -i') or 'git merge --squash' condenses multiple commits into one single commit."
  },
  {
    id: 9,
    category: "Monitoring & Observability",
    question: "In Prometheus architecture, how are metrics typically collected from target applications and services?",
    options: [
      "Applications push metrics to a centralized MySQL database",
      "Prometheus pulls (scrapes) HTTP metrics endpoints exposed by targets",
      "Prometheus scans log files stored on disk via FTP",
      "Targets send UDP packets on every function execution"
    ],
    correct: 1,
    explanation: "Prometheus uses a pull model, periodically scraping HTTP metrics endpoints (e.g. /metrics) exposed by target services."
  },
  {
    id: 10,
    category: "Docker & Containers",
    question: "What is the key benefit of multi-stage Docker builds?",
    options: [
      "They allow containers to run on Windows and Linux simultaneously",
      "They help drastically reduce final image size by keeping build tools out of production images",
      "They run containers across multiple cloud providers automatically",
      "They compress container logs using GZIP"
    ],
    correct: 1,
    explanation: "Multi-stage builds allow you to build artifacts in heavy staging containers and copy only the runtime binaries into lightweight final images."
  }
];

export function getRandomQuiz(count = 5) {
  // Shuffle and pick 5 items
  const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
