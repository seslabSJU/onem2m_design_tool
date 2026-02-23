<template>
    <div>
      <!-- Navbar -->
      <nav class="component-navbar">
        <div class="col-8 title">
            <img src="../assets/logo-removebg-preview.png" alt="Logo" style="width: 60px; margin-left: 30px; margin-top: 5px;">
            <p>
                oneM2M Data Model Design Tool
            </p>
        </div>
        <ul>
          <li><a href="https://github.com/seslabSJU/onem2m_design_tool" target="_blank">GitHub</a></li>
          <li><a href="https://onem2m.org" target="_blank">about oneM2M</a></li>
          <!-- <li><a href="#">Contact</a></li> -->
        </ul>
      </nav>
      <!-- The rest of your component's content -->
    </div>
  </template>

  <style scoped>
  .component-navbar {
  background: linear-gradient(135deg, #5a6fe6 0%, #667eea 30%, #8b6cc1 70%, #764ba2 100%);
  padding: 18px 24px;
  border-radius: 20px;
  margin: 10px 20px;
  box-shadow:
    0 14px 36px rgba(102, 126, 234, 0.45),
    0 6px 16px rgba(118, 75, 162, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  backdrop-filter: blur(10px);
}

.component-navbar .title {
  color: #fff;
  font-size: 26px;
  font-weight: 600;
  display: inline;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

.component-navbar .title p {
  margin-left: 10px; /* Remove the default top and bottom margins */
  padding-top: 10px;
  display: inline; /* Make the title appear inline */
}

.component-navbar ul {
  float: right; /* Float the list to the right */
  align-items: center; /* Center-align list items */
  list-style-type: none; /* Remove the bullet points for the list */
  display: inline-box;
  padding: 15px;
  margin: 0px;
}

.component-navbar li {
  display: inline; /* Display list items horizontally */
  text-align: center; /* Center-align list items */
  margin-left: 20px; /* Add space between list items */
  margin-right: 20px; /* Add space between list items */
}

.component-navbar a {
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  font-size: 15px;
  padding: 8px 18px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(5px);
}

.component-navbar a:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
}

  </style>
  