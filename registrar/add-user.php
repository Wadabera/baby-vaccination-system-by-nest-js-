<?php include("./parts/header.php") ?>
<style>
  label {
    display: block;
    margin-bottom: 10px;
  }

  input[type="text"],
  input[type="email"] {
    width: 100%;
    padding: 10px;
    border: 2px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    margin-bottom: 20px;
  }

  .error {
    border-color: red;
  }

  #error-message {
    color: red;
    font-weight: bold;
    margin-bottom: 20px;
  }

  button[type="submit"] {
    background-color: dodgerblue;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

  button[type="submit"]:hover {
    background-color: #0055cc;
  }
</style>

<?php

if (isset($_POST['submit'])) {
  $f_name = $_POST['f_name'];
  $m_name = $_POST['m_name'];
  $l_name = $_POST['l_name'];
  $birthdate = $_POST['birthdate'];
  $blood_type = $_POST['blood_type'];
  $phone_number = $_POST['phone_number'];
  $password = md5($_POST['password']);
  $zone = $_POST['zone'];
  $wereda = $_POST['wereda'];
  $kebele = $_POST['kebele'];

  if (!isset($_FILES['image']['name'])) {
    $image_name = "";
  } else {
    $image_name = $_FILES['image']['name'];
    $image_source = $_FILES['image']['tmp_name'];

    // Get the file extension
    $extension = pathinfo($image_name, PATHINFO_EXTENSION);

    // Generate the new image name
    $new_image_name = $id . $f_name . $m_name . $lname . '.' . $extension;

    $image_destination = "../images/mother/" . $new_image_name;

    $upload = move_uploaded_file($image_source, $image_destination);

    if ($upload == FALSE) {
      $_SESSION["add"] = "Failed to upload image";
      header("Location:" . HOMEURL . "/registrar/mother.php");
      die();
    }
  }

  $query = "INSERT INTO `webproject`.`mother_table` 
            (f_name, m_name, l_name, bithdate, photo_url, blood_type, m_phone, zone, wereda, kebele)
            VALUES
            ('$f_name', '$m_name', '$l_name', '$birthdate', '$new_image_name', '$blood_type', '$phone_number', '$zone', '$wereda', '$kebele')";

  $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

  if ($result) {
    $query2 = "INSERT INTO mother_vaccin (m_id, tt1, tt2, tt3, tt4, tt5, rh)
                   VALUES (LAST_INSERT_ID(), 0, 0, 0, 0, 0, 0)";

    $result2 = mysqli_query($conn, $query2) or die(mysqli_error($conn));

    if ($result2) {
      $_SESSION["add"] = $f_name . " successfully added";
      header("Location:" . HOMEURL . "/registrar/mother.php");
    } else {
      $_SESSION["add"] = $f_name . " failed to add vaccination information";
      header("Location:" . HOMEURL . "/registrar/add-user.php");
    }
  } else {
    $_SESSION["add"] = $f_name . " failed to add";
    header("Location:" . HOMEURL . "/registrar/add-user.php");
  }
} else {
  echo "Button not clicked";
}
?>


<?php include("./parts/footer.php") ?>