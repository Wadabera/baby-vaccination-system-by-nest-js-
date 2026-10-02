<?php
    include('./config/constant.php');

    if (isset($_POST['login'])) {
      $username = $_POST['user_name_123'];
      $password = md5($_POST['pass_word_123']);
      $query = "SELECT * FROM users WHERE username='$username' AND password='$password'";
      $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
      $rows = mysqli_num_rows($result);

      if ($rows == 1) {
        while ($row = mysqli_fetch_assoc($result)) {
          $role = strtolower($row['role']);  // Make role comparison case-insensitive
        }
        
        // Handling role-based redirection
        $_SESSION["login"] = $username . " login successfully";
        $_SESSION["username"] = $username;

        if ($role == 'admin') {
          header("Location:" . HOMEURL . "admin/index.php");
        } elseif ($role == 'registrar') {
          header("Location:" . HOMEURL . "registrar/index.php");
        } elseif ($role == 'doctor') {
          header("Location:" . HOMEURL . "health/index.php");
        } elseif ($role == 'User') {  // Ensure 'user' role is correctly recognized
          header("Location:" . HOMEURL . "./index.php");  // Adjust for the user-specific page
        } else {
          $_SESSION["login"] = "Unknown role detected";
          header("Location:" . HOMEURL . "login.php");
        }
      } else {
        $_SESSION["login"] = "Failed to login";
        header("Location: " . HOMEURL . "login.php");
      }
    }
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <script src="script.min.js"></script>
    <link rel="stylesheet" href="./css/style.min.css" />
    <link rel="stylesheet" href="./css/login.css" />
    <link rel="stylesheet" href="resources/css/style.css" />
    <link rel="stylesheet" href="vendors/font-aweome/css/all.css" />
    <title>Admin UI</title>

    <style>
       /* Common Button Styles */
.myhome, .mylog {
  background: linear-gradient(to right, #50b4d9, #69A2ED); /* Gradient Background */
  padding: 14px 28px; /* Balanced padding */
  border: 2px solid #778DDC; /* Strong border */
  border-radius: 12px; /* Smooth rounded corners */
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-transform: uppercase;/* Makes text stand out */
 
  text-decoration: none;
  transition: all 0.4s ease-in-out; /* Smooth transition */
  display: inline-block;
  text-align: center; /* Soft shadow */
  position: relative;
  overflow: hidden;
}

/* Hover Effect */
.myhome:hover, .mylog:hover {
  background: linear-gradient(to right, #778ddc, #99ACF4); /* Reverse gradient */
  color: #fff;
  transform: scale(1.12); /* Slight enlargement */
box-shadow: 0px 10px 20px rgba(0, 106, 255, 0.6);
/* Stronger shadow */
  border: 2px solid white;
}

/* Active/Click Effect */
.myhome:active, .mylog:active {
  transform: scale(0.95); /* Slight shrinking effect */
 /* Softer shadow */
}

/* Add Neon Glow Effect */
.myhome::before, .mylog::before {
  content: "";
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  
  z-index: -1;
  border-radius: 14px;
  filter: blur(8px);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.myhome:hover::before, .mylog:hover::before {
  opacity: 1;
}

/* General Styling */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    background-image:url('photoup.jpg');
    background-size:cover;
    background-repeat:norepeat;
    background-position:center;
}

/* Navigation Bar */
nav {
    background: linear-gradient(to right, #5793ad,#9fdef9); /* Modern gradient */
    padding: 15px 0;
    box-shadow: 0px 5px 20px rgba(60, 159, 198, 0.4);

}

nav a {
    color: white;
    font-size: 18px;
    text-decoration: none;
    padding: 12px 20px;
    font-weight: bold;
    border-radius: 8px;
    transition: all 0.4s ease-in-out;
    position: relative;
    overflow: hidden;
}

nav a:hover {
    transform: scale(1.1);
}

/* Header */
#main-header {
    color: black;
    text-align: left;
    padding: 50px 0;
    margin-bottom: 30px;
    font-size: 6em;
    opacity:0.6;
    animation: fadeIn 2s ease-in-out;
}

/* Card Styling */
#posts .card {
    border: 2px solid #ccc;
    border-radius: 15px;
    box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
    padding: 25px;
    background: linear-gradient(to right, white, #f9f9f9);
    transition: all 0.3s ease-in-out;
}

#posts .card:hover {
    transform: scale(1.05);
    box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.2);
}

.card-header {
    text-align: center;
    font-size: 1.5em;
    color: #007bff;
    font-weight: bold;
}

/* Success Message */
.success {
    color: #28a745;
    font-size: 1.8em;
    animation: fadeIn 2s ease-in-out;
    text-shadow: 2px 2px 10px rgba(40, 167, 69, 0.5);
}

/* Table Styling */
table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1);
}

td {
    padding: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
}

/* Input Fields */
input[type="text"],
input[type="password"] {
    width: 100%;
    padding: 12px;
    border: 2px solid #ccc;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

input[type="text"]:focus,
input[type="password"]:focus {
    border-color: #007bff;
    box-shadow: 0px 0px 15px rgba(0, 123, 255, 0.6);
}
.navbar{
background:none;
opacity:0.4;
}
/* Buttons */
.btn-sec {
    background: linear-gradient(to right, #007bff, #0056b3);
    color: white;
    font-size: 18px;
    font-weight: bold;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.4s ease-in-out;
    box-shadow: 0px 5px 15px rgba(0, 123, 255, 0.4);
    position: relative;
    overflow: hidden;
}
.sucess{
color:black;
font-size:30px;
}
/* Button Hover Effect */
.btn-sec:hover {
    background: linear-gradient(to right, #0056b3, #007bff);
    transform: translateY(-5px);
    box-shadow: 0px 10px 25px rgba(0, 123, 255, 0.5);
    animation: bounce 1s ease-in-out;
}

/* Error Messages */
.error {
    color: red;
    font-size: 18px;
    text-align: center;
}

/* Animation Effects */
@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(-20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes bounce {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0);
    }
}

/* Responsive Design */
@media screen and (max-width: 768px) {
    #main-header {
        font-size: 1.5em;
    }

    .card-header {
        font-size: 1.2em;
    }

    input[type="text"],
    input[type="password"] {
        font-size: 14px;
    }

    .btn-sec {
        font-size: 16px;
    }
}
    </style>
  </head>
  <body>
    <!-- NAVIGATION-->
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark p-0">
      <div class="container">
        <a href="index.php" class="navbar-brand">Infant Immunization</a>
        <button class="navbar-toggler" data-toggle="collapse" data-target="#navbarNav"></button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ml-auto">
            <li class="nav-item">
              <a href="./regisrtation.php" class="nav-link">
                <i class="fa fa-user-times mylog"> signup</i>
              </a>
            </li>
            <li class="nav-item">
              <a href="./newhome.php" class="nav-link">
                <i class="fa fa-home  myhome"> Home</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- HEADER -->
    <header id="main-header" class="py-2">
      <div class="container">
        <div class="row">
          <div class="col-md-6" id="welcomee">
            <h1><i class="fa fa-gear"></i> Welcome To Vaccination</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- POSTS SECTION -->
    <section id="posts">
      <div class="container">
        <div class="row">
          <div class="col-md">
            <div class="card">
              <div class="card-header">
                <h1 class="sucess">Infant Immunization</h1>
              </div>
              <div class="card-body">
                <form action="#" method="post">
                  <table class="halfwidth">
                    <tr>
                      <td>Username</td>
                      <td>
                        <input type="text" name="user_name_123" placeholder="Username" required autocomplete="off" />
                      </td>
                    </tr>
                    <tr>
                      <td>Password</td>
                      <td>
                        <input type="password" name="pass_word_123" placeholder="Password" required autocomplete="new-password" />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <input type="submit" name="login" value="Login" class="btn-sec" />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="text-align: center;">
                        <!-- Registration Button -->
                        <a href="./regisrtation.php" class="btn-sec" style="text-decoration: none;">Register Here</a>
                      </td>
                    </tr>
                  </table>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </body>
</html>
