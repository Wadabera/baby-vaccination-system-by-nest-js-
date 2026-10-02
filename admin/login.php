
<?php
  include('../config/constant.php');

  if (isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = md5($_POST['password']);
    $query = "SELECT * FROM users WHERE username='$username' AND password='$password'";
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
    $rows = mysqli_num_rows($result);

    if ($rows == 1) {
      while ($rows = mysqli_fetch_assoc($result)) {
        $role = $rows['role'];
      }
      if ($roles == 'admin') {
        $_SESSION["login"] = $id . "login successfully";
        $_SESSION["username"] = $username;
        header("Location:" . HOMEURL . "admin/index.php");
      } elseif ($role == 'registrar') {
        $_SESSION["login"] = $id . "login successfully";
        $_SESSION["username"] = $username;
        header("Location:" . HOMEURL . "registrar/index.php");
      }
    } else {
      $_SESSION["login"] = " fail to login";
      if (isset($_SESSION['login'])) {
        echo "<h1 class='error'>" . $_SESSION['login'] . "</h1>";
        unset($_SESSION['login']);
      }
    }
  }


  include("./parts/footer.php")
  ?>
<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <script src="script.min.js"></script>

  <link rel="stylesheet" href="style.min.css" />
  <link rel="stylesheet" href="resources/css/style.css" />
  <link rel="stylesheet" href="vendors/font-aweome/css/all.css" />
  <title>Admin UI</title>
  
  <style>

  /* General Styles */
body {
    font-family: 'Poppins', sans-serif;
    background-color: #eef2f3;
    color: #333;
    margin: 0;
    padding: 0;
    transition: background-color 0.3s ease-in-out;
    text-align: center;
}

/* Navigation Bar */
.navbar {
    background: linear-gradient(135deg, #007bff, #6610f2);
    position: fixed;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease-in-out;
    display: flex;
    justify-content: center;
    padding: 15px 0;
}
.navbar-brand {
    font-size: 2rem;
    font-weight: bold;
    color: #fff !important;
}
.navbar-nav .nav-item .nav-link {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    transition: transform 0.3s ease-in-out, color 0.3s ease-in-out;
    margin: 0 15px;
    padding: 10px 20px;
    border-radius: 30px;
    background: #ff5733;
}
.navbar-nav .nav-item .nav-link:hover {
    background: #c70039;
    transform: scale(1.2);
}

/* Header */
#main-header {
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    text-align: center;
    padding: 20px 0;
    font-size: 2rem;
    font-weight: bold;
    position: fixed;
    width: 100%;
    top: 56px;
    z-index: 999;
    transition: all 0.3s ease-in-out;
}

/* Card Section */
.card {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    background-color: #fff;
    padding: 20px;
    margin: 20px;
    width: 80%;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    
    position:fixed;
    top:20%;
    
    background-color:8B5DFF;
    
}
.card:hover {
    transform: scale(1.05);
    box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.2);
}
.card-header h1 {
    font-size: 2rem;
    color: #007bff;
    
  
    
}

/* Form Styles */
form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color:FFC145;
    
    
}
.halfwidth {
    width: 100%;
   
}
input[type="text"],
input[type="password"] {
    width: 80%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1.2rem;
}
input[type="submit"] {
    font-size: 1.5rem;
    padding: 12px 25px;
    background: #ff5733;
    color: #fff !important;
    border-radius: 30px;
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;
    border: none;
    cursor: pointer;
}
input[type="submit"]:hover {
    background: #c70039;
    transform: scale(1.2);
}

/* Footer */
#main-footer {
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: #fff;
    text-align: center;
    position: fixed;
    bottom: 0;
    width: 100%;
    padding: 15px 0;
    transition: all 0.3s ease-in-out;
}

/* Responsive Styles */
@media (max-width: 1024px) {
    .navbar-nav .nav-item .nav-link {
        font-size: 1.3rem;
    }
    .card {
        width: 90%;
    }
}

@media (max-width: 768px) {
    .navbar-nav {
        flex-direction: column;
        align-items: center;
    }
    .navbar-nav .nav-item .nav-link {
        font-size: 1.2rem;
    }
    .card {
        width: 95%;
    }
}

@media (max-width: 480px) {
    .navbar-nav .nav-item .nav-link {
        font-size: 1rem;
    }
    .card-header h1 {
        font-size: 1.5rem;
    }
}

  </style>
</head>

<body>
  <!-- NAVIGATION-->
  <nav class="navbar navbar-expand-sm navbar-dark bg-dark p-0">
    <div class="container">
      <a href="index.html" class="navbar-brand">Infant Immunization</a>
      <button class="navbar-toggler" data-toggle="collapse" data-target="#navbarNav"></button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <a href="./admin/login.php" class="nav-link">
              <i class="fa fa-user-times"> Login</i>
            </a>
          </li>
          <li class="nav-item">
            <a href="../index.php" class="nav-link">
              <i class="fa fa-user-times"> Home</i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <!--HEADER -->
  <header id="main-header" class="py-2 bg-primary text-white">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h1><i class="fa fa-gear">Welcome Vaccination</i></h1>
        </div>
      </div>
    </div>
  </header>


  <section id="posts">
    <div class="container">
      <div class="row">
        <div class="col-md">
          <div class="card">

            <div class="card-header">
              <h1 class='sucess'>
                Infant immunization
              </h1>
            </div>
            <div class="card-header">
              <form action="#" method="post">
                <table class="halfwidth">
                  <tr>
                    <td>username</td>
                    <td> <input type="text" name="username" placeholder="username"> </td>
                  </tr>
                  <tr>
                    <td>password</td>
                    <td><input type="password" name="password" placeholder="password"></td>
                  </tr>
                  <tr>
                    <td colspan="2"><input type="submit" name="login" value="login" class="btn-sec"></td>
                  </tr>
                </table>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  </section>




  