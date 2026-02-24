<template>
    <div style="overflow: visible;">
      <!-- Navbar -->
      <nav class="component-navbar">
        <div class="col-8 title">
            <img src="../assets/logo-removebg-preview.png" alt="Logo" style="width: 60px; margin-left: 30px; margin-top: 5px;">
            <p>
                oneM2M Data Model Design Tool
            </p>
        </div>
        <div class="navbar-right">
          <ul>
            <li>
              <a href="https://github.com/seslabSJU/onem2m_design_tool" target="_blank">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://onem2m.org" target="_blank">
                <svg class="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                oneM2M
              </a>
            </li>
          </ul>
          <slot></slot>
        </div>
      </nav>
      <!-- The rest of your component's content -->
    </div>
  </template>

  <style scoped>
  .component-navbar {
  background: linear-gradient(135deg, rgba(30, 47, 84, 0.92) 0%, rgba(25, 40, 71, 0.96) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 10px 24px;
  border-radius: 16px;
  margin: 10px 20px;
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.45),
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(100, 160, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(100, 140, 220, 0.15);
  position: relative;
  overflow: visible;
}

.component-navbar .title {
  color: #f1f5f9;
  font-size: 22px;
  font-weight: 600;
  display: inline;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.3px;
}

.component-navbar .title p {
  margin-left: 10px;
  padding-top: 8px;
  display: inline;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.component-navbar ul {
  float: right;
  align-items: center;
  list-style-type: none;
  display: inline-box;
  padding: 10px;
  margin: 0px;
}

.component-navbar li {
  display: inline;
  text-align: center;
  margin-left: 16px;
  margin-right: 16px;
}

.component-navbar a {
  text-decoration: none;
  color: #7b93c0;
  font-weight: 500;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  background: transparent;
}

.component-navbar a:hover {
  color: #c7d4ea;
  background: rgba(100, 150, 255, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.component-navbar a .nav-icon {
  vertical-align: middle;
  margin-right: 5px;
  margin-top: -2px;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.component-navbar a:hover .nav-icon {
  opacity: 1;
}

  </style>
  