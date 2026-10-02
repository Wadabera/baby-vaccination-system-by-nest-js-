<?php include("./parts/header.php");

// find id
$id = $_GET['id'];
// delete from db
$query = "SELECT * FROM `webproject`.`post_img` WHERE post_id='$id' ";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));
$rows = mysqli_num_rows($result);
while ($rows = mysqli_fetch_assoc($result)) {
   $photo_url = $rows['img_url'];
}

$query1 = "DELETE FROM `webproject`.`post_img` WHERE post_id ='$id'";
$result1 = mysqli_query($conn, $query1) or die(mysqli_error($conn));
if ($result1 == True) {

   $query = "DELETE FROM `webproject`.`post` WHERE post_id ='$id'";
   $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

   if ($result == True) {
      $sourceDirectory = '../images/posts/';
      $destinationDirectory = '../backup/image/posts/';
      $imageName = $photo_url;

      $sourcePath = $sourceDirectory . $imageName;
      $destinationPath = $destinationDirectory . $imageName;
      $moveBackup = rename($sourcePath, $destinationPath);

      $_SESSION["add"] = $id . " deleted successfully";
      header("Location:" . HOMEURL . "admin/post.php");
      if (isset($_SESSION['add'])) {
         echo "<script>alert('" . $_SESSION['add'] . "')</script>";
         unset($_SESSION['add']);
      }
      if ($moveBackup) {
         echo 'Image moved to backup directory successfully.';
      } else {
         echo 'Failed to move image to backup directory.';
      }
   } else {
      $_SESSION["add"] = " failed to delete";
   }
}




include("./parts/footer.php");
