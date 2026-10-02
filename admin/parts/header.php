<?php 
// Start with PHP
include("../config/constant.php");
include("logincheck.php");
$usr = $_SESSION['username'];
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <script src="script.min.js" defer></script>
  <link rel="stylesheet" href="../css/style.min.css" />
  <link rel="stylesheet" href="resources/css/style.css" />
  <link rel="stylesheet" href="vendors/font-awesome/css/all.css" />
  <link rel="stylesheet" href="../../css/profile.css">
  
  <!-- Font Link (Google Fonts) -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <title>Admin UI</title>
</head>

<body>
  <!-- NAVIGATION-->
  <nav class="navbar navbar-expand-sm navbar-dark p-0 navbar-hover">
    <div class="container">
      <a href="index.php" class="navbar-brand">Infant Immunization</a>
      <button class="navbar-toggler" data-toggle="collapse" data-target="#navbarNav"></button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item px-3">
            <a href="index.php" class="nav-link active">Dashboard</a>
          </li>
          <li class="nav-item px-3">
            <a href="post.php" class="nav-link">Post</a>
          </li>
          <li class="nav-item px-3">
            <a href="users.php" class="nav-link">Users</a>
          </li>
        </ul>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item dropdown mr-3">
            <a href="profile.php?username=<?php echo $usr ?>" class="nav-link dropdown-toggle">
              <i class="fa fa-user"></i> <?php echo $usr; ?> Profile
            </a>
            <div class="dropdown-menu">
              <a href="profile.php?usr='<?php echo $usr; ?>'" class="dropdown-item">
                <i class="fa fa-user-circle"></i> Profile
              </a>
              <a href="settings.php" class="dropdown-item">
                <i class="fa fa-gear"></i> Settings
              </a>
            </div>
          </li>
          <li class="nav-item">
            <a href="../logout.php" class="nav-link">
              <i class="fa fa-user-times"></i> Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>   

  <!-- Add your other page content here -->

  <style>
    /* General Body and Font Settings */
    body {
      font-family: 'Poppins', sans-serif;
      background-color: #f4f6f9;
      color: #333;
    }

    /* Gradient Effect for Navbar */
    .navbar-hover {
      background: linear-gradient(135deg, rgba(255, 60, 108, 1), rgba(29, 78, 216, 1));
      border-radius: 8px;
      transition: box-shadow 0.4s ease-in-out;
      box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
    }

    /* Navbar Link Styles */
    .navbar-nav .nav-link {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
      text-transform: uppercase;
      transition: all 0.3s ease;
      position: relative;
      padding: 12px 20px;
    }

    /* Text Hover Effect - Text color change, glow, and smooth transition */
    .navbar-nav .nav-link:hover {
      color: #ff3c6c; /* Text color change */
      text-shadow: 0 0 10px rgba(255, 60, 108, 0.8), 0 0 15px rgba(29, 78, 216, 0.8);
      transform: translateY(-2px); /* Slight upward movement */
      letter-spacing: 1px; /* Slight spacing increase */
    }

    /* Active Navbar Link with Neon Glow */
    .navbar-nav .nav-link.active {
      color: #fff;
      text-shadow: 0px 0px 8px rgba(29, 78, 216, 0.9), 0px 0px 15px rgba(255, 60, 108, 0.9);
    }

    /* Dropdown Menu - No Background Hover, Only Text Hover */
    .navbar-nav .nav-item.dropdown:hover .dropdown-menu {
      box-shadow: 0px 8px 15px rgba(255, 60, 108, 0.6), 0px 0px 15px rgba(29, 78, 216, 0.8);
    }

    .navbar-nav .dropdown-item {
      font-size: 1rem;
      font-weight: bold;
      color: #fff;
      transition: all 0.3s ease;
      padding: 12px 20px;
    }

    /* Text Hover Effect for Dropdown Items */
    .navbar-nav .dropdown-item:hover {
      color: #ff3c6c; /* Text color change */
      transform: translateX(5px); /* Slight movement for emphasis */
      text-shadow: 0 0 10px rgba(255, 60, 108, 0.8); /* Neon text glow */
    }

    /* Navbar Border and Shadow */
    .navbar {
      border-radius: 8px;
      box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
    }

    /* Adjust Navbar Container Padding */
    .navbar .container {
      padding: 0.5rem 1rem;
    }

    /* Button Hover and Animation Effects */
    .navbar-nav .nav-item a {
      position: relative;
      overflow: hidden;
    }

    .navbar-nav .nav-item a:before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 300%;
      height: 300%;
      color:black
      transition: all 0.4s ease;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
    }

    .navbar-nav .nav-item a:hover:before {
      transform: translate(-50%, -50%) scale(1);
    }

    .navbar-nav .nav-item a:hover {
      color: #fff;
      text-shadow: 0 0 10px rgba(255, 60, 108, 0.8);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .navbar-nav .nav-link {
        font-size: 1.2rem;
        padding: 10px 15px;
      }
    }
  </style>
</body>

</html>
