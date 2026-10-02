<?php include('./parts/header.php');
$id = $_GET['id'];

?>



<div id="addUserModal" class="">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-warning text-white">
        <h5 class="modal-title">Update vaccine</h5>
        <button class="close" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>
      <?php $query = "SELECT * FROM vaccination_description where v_id='$id'";
      $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
      $rows = mysqli_num_rows($result);
      if ($rows > 0) {
        while ($rows = mysqli_fetch_assoc($result)) {
          $vaccine_name = $rows['vaccine_name'];
          $description = $rows['description'];
      ?>

          <form action='#' method='post' enctype='multipart/form-data'>
            <div class="modal-body">
              <div class="form-group">
                <label for="name">vaccine name</label>
                <input type="text" class="form-control" value='<?php echo $vaccine_name ?>' name='vaccine_name' />
              </div>
              <div class="form-group">
                <label for="name">description </label>
                <textarea name='description' class="form-control"><?php echo $description ?></textarea>
              </div>
          <?php
        }
      }
          ?>
          <div class="modal-footer">
            <a href='./categories.php' class='btn'>Close</a>
            <input type="submit" class="btn btn-warning" name='updatevaccine' value="submit">
          </div>
            </div>
          </form>





          <?php



          if (isset($_POST['updatevaccine'])) {
            $vaccine_name = $_POST['vaccine_name'];
            $description = $_POST['description'];
            $query = "UPDATE vaccination_description SET vaccine_name='$vaccine_name', description='$description' where v_id='$id'";
            $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

            if ($result == True) {
              $_SESSION["add"] = $vaccine_name . " sucessfully updated";
              header("Location:" . HOMEURL . "admin/categories.php");
            } else {
              $_SESSION["add"] = $username . " failed to update";
            }
          }




          include('./parts/footer.php'); ?>