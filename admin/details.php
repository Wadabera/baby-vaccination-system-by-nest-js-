<?php
ob_start(); // Start output buffering

// Include the header file
include("./parts/header.php");

$id = $_GET['id'];  // Get the post ID

// Process the form submission
if (isset($_POST['updatepost'])) {
    $title = $_POST['tittle'];
    $catagory = $_POST['catagory'];
    $description = $_POST['editor1'];
    $date_of_post = date('y-m-d h:m:s');
    
    // SQL query to update the post in the database
    $query = "UPDATE `webproject`.`post` SET
               tittle='$title',
               catagory='$catagory', 
               description='$description', 
               date_of_post='$date_of_post' 
               WHERE post_id='$id'";

    // Execute the query
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
    
    // Check if the query was successful
    if ($result == True) {
        $_SESSION["add"] = $title . " successfully updated";
        header("Location: " . HOMEURL . "admin/post.php");
        exit(); // Stop further execution after header redirection
    } else {
        $_SESSION["add"] = $title . " failed to update";
    }
}
?>

<!--HEADER -->
<header id="main-header" class="py-2 bg-primary text-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h1>Post One</h1>
      </div>
    </div>
  </div>
</header>

<!--ACTIONS BUTTONS-->
<section id="action" class="py-4 mb-4 bg-light">
  <div class="container">
    <div class="row">
      <div class="col-md-3 mr-auto">
        <a href="post.php" class="btn btn-light btn-block"><i class="fa fa-arrow-left"></i> Back to Post</a>
      </div>
    </div>
  </div>
</section>

<section id="posts">
  <div class="container">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-header">
            <h4>Edit Posts</h4>
          </div>
          <div class="card-body">
            <form action="#" method="post">
              <?php
              // Fetch the post data from the database
              $query = "SELECT * FROM webproject.post WHERE post_id='$id'";
              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
              $rows = mysqli_num_rows($result);

              if ($rows > 0) {
                while ($rows = mysqli_fetch_assoc($result)) {
                  $id = $rows['post_id'];
                  $title = $rows['tittle'];
                  $catagory = $rows['catagory'];
                  $description = $rows['description'];
                  $date_of_post = $rows['date_of_post'];
              ?>

              <!-- Form to edit the post -->
              <div class="form-group">
                <label for="title">Title</label>
                <input type="text" name="tittle" class="form-control" value="<?php echo $title; ?>" />
              </div>

              <div class="form-group">
                <label for="categories">Categories</label>
                <select name="catagory" id="catagory" class="form-control">
                  <option value="mothers vacine" <?php if ($catagory == 'mothers vacine') echo "selected"; ?>>Mother vaccine</option>
                  <option value="Children vacine" <?php if ($catagory == 'Children vacine') echo "selected"; ?>>Children vaccine</option>
                  <option value="Infant news" <?php if ($catagory == 'Infant news') echo "selected"; ?>>Infant news</option>
                  <option value="daily news" <?php if ($catagory == 'daily news') echo "selected"; ?>>Daily news</option>
                  <option value="other" <?php if ($catagory == 'other') echo "selected"; ?>>Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="body">Body</label>
                <textarea name="editor1" id="editor1" class="form-control"><?php echo $description; ?></textarea>
              </div>

              <?php
                }
              }
              ?>
              <div class="col-md-3">
                <input type="submit" class="btn btn-primary" name="updatepost" value="Save changes">
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<?php
// Include the footer file
include("./parts/footer.php");

// Flush the output buffer
ob_end_flush();
?>
