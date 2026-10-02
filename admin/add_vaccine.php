<?php include("./parts/header.php"); ?>

<div id="addUserModal" class="">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-warning text-white">
        <h5 class="modal-title">Add new vaccine</h5>
        <button class="close" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>

      <form action='#' method='post' enctype='multipart/form-data'>
        <div class="modal-body">
          <div class="form-group">
            <label for="name">vaccine name</label>
            <input type="text" class="form-control" name='vaccine_name' />
          </div>
          <div class="form-group">
            <label for="name">description </label>
            <textarea name='description' class="form-control"></textarea>
          </div>
          <div class="modal-footer">
            <button data-dismiss="modal">Close</button>
            <input type="submit" class="btn btn-warning" name='addvaccine' value="submit">
          </div>
        </div>
      </form>





      <?php


      if (isset($_POST['addvaccine'])) {
        $vaccine_name = $_POST['vaccine_name'];
        $description = $_POST['description'];
        $query = "INSERT INTO vaccination_description (vaccine_name, description)
    VALUES ('$vaccine_name','$description')";
        $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

        if ($result == True) {
          $_SESSION["add"] = $vaccine_name . " sucessfully added";
          header("Location:" . HOMEURL . "admin/categories.php");
        } else {
          $_SESSION["add"] = $vaccine_name . " failed to added";
        }
      }
      if (isset($_SESSION['add'])) {
        echo "<script>alert('" . $_SESSION['add'] . "')</script>";
        unset($_SESSION['add']);
      }


      include("./parts/footer.php"); ?>