<?php include("./parts/header.php") ?>

<!--HEADER -->
<header id="main-header" class="py-2 bg-warning text-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h1><i class="fa fa-users"> Users</i></h1>
      </div>
    </div>
  </div>
</header>

<!--ACTIONS BUTTONS-->
<!-- <section id="action" class="py-4 mb-4 bg-light">
  <div class="container">
    <div class="row">
      <div class="col-md-6 ml-auto">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Search" id="search-input">
          <span class="input-group-btn">
            <button class="btn btn-warning" id="search-btn">Search</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</section> -->

<section id="posts">
  <div class="container">
    <div class="row">
      <div class="col">
        <section id="action" class="py-4 mb-4 bg-light">
          <div class="container">
            <div class="row">
              <div class="col-md-3">
                <a href="#addUserModal" class="btn btn-warning btn-block" data-toggle="modal">
                  <i class="fa fa-plus"> Add Users</i>
                </a>
              </div>
              <?php
              if (isset($_SESSION['add'])) {
                echo "<script>alert('" . $_SESSION['add'] . "')</script>";
                unset($_SESSION['add']);
              }
              ?>
            </div>
          </div>
        </section>
        <div class="card">
          <div class="card-header">
            <h4>Latest Users</h4>
          </div>
          <table class="table table-striped">
            <thead class="thead-inverse">
              <tr>
                <td>id</td>
                <th>username</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-table">
              <?php
              $query = "SELECT * FROM users";
              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
              $rows = mysqli_num_rows($result);
              // check if query is successfully executed   
              if ($rows > 0) {
                $count = 1;
                // check the numbers of data in db
                while ($rows = mysqli_fetch_assoc($result)) {
                  $id = $rows['user_id'];
                  $username = $rows['username'];
                  $rol = $rows['role'];
                  $f_name = $rows['f_name'];
                  $m_name = $rows["m_name"];
                  $l_name = $rows['l_name'];
                  $phone_number = $rows["phone_number"];
                  $email = $rows['email'];
              ?>
                  <tr>
                    <td><?php echo $id; ?></td>
                    <td><?php echo $username ?></td>
                    <td><?php echo $rol; ?></td>
                    <td><?php echo $phone_number; ?></td>
                    <td><?php echo $email; ?></td>
                    <td>
                      <div class="row">
                        <div class="col-md-6">
                          <a href="update_user.php?id=<?php echo $id ?>" class="btn btn-primary btn-block">
                            <i class="fa fa-plus">Update</i>
                          </a>
                        </div>
                        <div class="col-md-6">
                          <a href="delete_user.php?id=<?php echo $id; ?>&username=<?php echo $username; ?>" class="btn btn-danger btn-block">Delete</a>
                        </div>
                      </div>
                    </td>
                  </tr>
              <?php
                }
              }
              ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<!--USER MODAL-->
<div id="addUserModal" class="modal fade">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-warning text-white">
        <h5 class="modal-title">Add User</h5>
        <button class="close" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>
      <form action="./add-user.php" method="post" enctype="multipart/form-data" onsubmit="return validateForm()">
        <div class="modal-body">
          <div class="form-group">
            <label for="name">First name</label>
            <input type="text" class="form-control" name="f_name" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
          </div>
          <div class="form-group">
            <label for="name">Middle name</label>
            <input type="text" name="m_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
          </div>
          <div class="form-group">
            <label for="name">Last name</label>
            <input type="text" name="l_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
          </div>
          <div class="form-group">
            <label for="name">Username</label>
            <input type="text" name="username" class="form-control" pattern="[A-Za-z0-9]+" minlength="5" required>
          </div>
          <div class="form-group">
            <label for="name">Role</label>
            <select name="role" id="role" required>
              <option value="">Select a role</option>
              <option value="admin">admin</option>
              <option value="registrar">registrar</option>
              <option value="doctor">doctor</option>
            </select>
          </div>
          <div class="form-group">
            <label for="name">Phone number</label>
            <input type="text" name="phone_number" class="form-control" pattern="^\+251\d{2}\d{3}\d{4}$" placeholder="+251-XX-XXX-XXXX" required>
          </div>
          <div class="form-group">
            <label for="name">Photo</label>
            <input type="file" name="image" accept="image/*" required>
          </div>
          <div class="form-group">
            <label for="Email">Email</label>
            <input type="email" name="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" name="password" class="form-control" pattern="^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$" title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character." required>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" name="c_password" class="form-control" pattern="^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$" title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character." required>
          </div>
          <div class="modal-footer">
            <button data-dismiss="modal">Close</button>
            <input type="submit" class="btn btn-warning" name="submit" value="Submit">
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  // function validateForm() {
  //   var firstName = document.getElementsByName('f_name')[0].value;
  //   var middleName = document.getElementsByName('m_name')[0].value;
  //   var lastName = document.getElementsByName('l_name')[0].value;
  //   var username = document.getElementsByName('username')[0].value;
  //   var phoneNumber = document.getElementsByName('phone_number')[0].value;
  //   var email = document.getElementsByName('email')[0].value;
  //   var password = document.getElementsByName('password')[0].value;
  //   var confirmPassword = document.getElementsByName('c_password')[0].value;

  //   if (firstName === "") {
  //     alert("Please enter the first name.");
  //     return false;
  //   }

  //   if (middleName === "") {
  //     alert("Please enter the middle name.");
  //     return false;
  //   }

  //   if (lastName === "") {
  //     alert("Please enter the last name.");
  //     return false;
  //   }

  //   if (username === "") {
  //     alert("Please enter the username.");
  //     return false;
  //   }

  //   if (phoneNumber === "") {
  //     alert("Please enter the phone number.");
  //     return false;
  //   }

  //   if (email === "") {
  //     alert("Please enter the email.");
  //     return false;
  //   }

  //   if (password === "") {
  //     alert("Please enter the password.");
  //     return false;
  //   }

  //   if (confirmPassword === "") {
  //     alert("Please enter the confirm password.");
  //     return false;
  //   }

  //   if (password !== confirmPassword) {
  //     alert("Passwords do not match");
  //     return false;
  //   }

  //   return true;
  // }


  function validateForm() {
    var firstName = document.forms[0].f_name;
    var middleName = document.forms[0].m_name;
    var lastName = document.forms[0].l_name;
    var username = document.forms[0].username;
    var role = document.forms[0].role;
    var phoneNumber = document.forms[0].phone_number;
    var email = document.forms[0].email;
    var password = document.forms[0].password;
    var confirmPassword = document.forms[0].c_password;

    // Resetting previous error messages (if any)
    var errorMessages = document.getElementsByClassName("error-message");
    for (var i = 0; i < errorMessages.length; i++) {
      errorMessages[i].style.display = "none";
    }

    // First Name validation
    if (!firstName.checkValidity()) {
      document.getElementById("firstNameError").style.display = "block";
      return false;
    }

    // Middle Name validation
    if (!middleName.checkValidity()) {
      document.getElementById("middleNameError").style.display = "block";
      return false;
    }

    // Last Name validation
    if (!lastName.checkValidity()) {
      document.getElementById("lastNameError").style.display = "block";
      return false;
    }

    // Username validation
    if (!username.checkValidity()) {
      document.getElementById("usernameError").style.display = "block";
      return false;
    }

    // Role validation
    if (role.value === "") {
      document.getElementById("roleError").style.display = "block";
      return false;
    }

    // Phone Number validation
    if (!phoneNumber.checkValidity()) {
      document.getElementById("phoneNumberError").style.display = "block";
      return false;
    }

    // Email validation
    if (!email.checkValidity()) {
      document.getElementById("emailError").style.display = "block";
      return false;
    }

    // Password validation
    if (!password.checkValidity()) {
      document.getElementById("passwordError").style.display = "block";
      return false;
    }

    // Confirm Password validation
    if (!confirmPassword.checkValidity() || confirmPassword.value !== password.value) {
      document.getElementById("confirmPasswordError").style.display = "block";
      return false;
    }

    // If all validations pass, the form will be submitted
    return true;
  }
</script>


<!-- Error messages -->
<div class="error-message" id="firstNameError" style="display: none;">Please enter a valid first name (3-20 letters only).</div>
<div class="error-message" id="middleNameError" style="display: none;">Please enter a valid middle name (3-20 letters only).</div>
<div class="error-message" id="lastNameError" style="display: none;">Please enter a valid last name (3-20 letters only).</div>
<div class="error-message" id="usernameError" style="display: none;">Please enter a valid username (at least 5 characters).</div>
<div class="error-message" id="roleError" style="display: none;">Please select a role.</div>
<div class="error-message" id="phoneNumberError" style="display: none;">Please enter a valid phone number (numbers only).</div>
<div class="error-message" id="emailError" style="display: none;">Please enter a valid email address.</div>
<div class="error-message" id="passwordError" style="display: none;">Please enter a valid password (at least 8 characters, containing at least one uppercase letter, one lowercase letter, one digit, and one special character).</div>
<div class="error-message" id="confirmPasswordError" style="display: none;">Passwords do not match.</div>

<!-- JavaScript -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
  $(document).ready(function() {
    $("#search-btn").click(function() {
      var searchValue = $("#search-input").val();
      $.ajax({
        url: "search.php",
        method: "POST",
        data: {
          search: searchValue
        },
        success: function(response) {
          $("#users-table").html(response);
        }
      });
    });
  });
</script>

<?php include("./parts/footer.php") ?>