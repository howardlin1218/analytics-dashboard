module.exports = {
  apps: [
    {
      name: "api",
      script: "./api.js",
      // Restrict memory to 300MB to prevent kswapd0 thrashing
      node_args: "--max-old-space-size=300",
      // Force "fork" mode to save RAM on 1vCPU
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "local" }
    },
    {
      name: "server-dashboard",
      script: "./server2.js",
      node_args: "--max-old-space-size=300",
      instances: 1,
      exec_mode: "fork"
    },
    {
      name: "server-logs",
      script: "./server3.js",
      node_args: "--max-old-space-size=300",
      instances: 1,
      exec_mode: "fork"
    }
  ]
};