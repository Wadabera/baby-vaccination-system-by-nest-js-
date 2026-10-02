<?php
include("./parts/header.php");

if (isset($_SESSION['add'])) {
    echo "<script>alert('" . $_SESSION['add'] . "')</script>";
    unset($_SESSION['add']);
}
?>





<div id="addPostModal" class="">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Add Post</h5>
                <button class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="#" method="post" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="title">Title</label>
                        <input type="text" name="title" class="form-control" required />
                    </div>
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select class="form-control" name="category" required>
                            <option value="">Select Category</option>
                            <option value="mothers vacine">mothers vacine</option>
                            <option value="Children vacine">Children vacine</option>
                            <option value="Infant news">Infant news</option>
                            <option value="daily news">daily news</option>
                            <option value="other">other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="file">Image Upload</label>
                        <input type="file" name="image" id="image" accept="image/*" class="form-control" required />
                        <small class="form-text text-muted">Max file size: 3MB</small>
                    </div>
                    <div class="form-group">
                        <label for="body">Body</label>
                        <textarea name="editor1" id="" class="form-control" required></textarea>
                    </div>

                    <div class="modal-footer">
                        <a href="post.php" class="btn btn-secondary" data-dismiss="modal">Close</a>
                        <input type="submit" name="updatepost" value="Post" class="btn btn-primary">
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php
if (isset($_POST['updatepost'])) {
    $title = $_POST['title'];
    $category = $_POST['category'];
    $editor1 = $_POST["editor1"];
    $date_of_post = date('Y-m-d h:m:s');

    if (!isset($_FILES['image']['name'])) {
        $image_name = "";
    } else {
        $image_name = $_FILES['image']['name'];
        $image_source = $_FILES['image']['tmp_name'];
        $image_extension = pathinfo($image_name, PATHINFO_EXTENSION);
        $image_destination = "../images/posts/" . $title . "." . $image_extension; // Renaming the image with the news title and original extension
        $upload = move_uploaded_file($image_source, $image_destination);
        $image_name = $title . "." . $image_extension;
        if ($upload == FALSE) {
            $_SESSION["add"] = "Failed to upload image";
            die();
        }
    }

    $query = "INSERT INTO `webproject`.`post` (tittle, catagory, description, date_of_post) VALUES ('$title', '$category', '$editor1', '$date_of_post')";
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

    if ($result == True) {
        $_SESSION["add"] = $title . " successfully added";
    } else {
        $_SESSION["add"] = $title . " failed to add";
    }

    $query2 = "SELECT post_id FROM post WHERE date_of_post='$date_of_post'";
    $result2 = mysqli_query($conn, $query2) or die(mysqli_error($conn));
    $rows2 = mysqli_num_rows($result2);

    if ($rows2 > 0) {
        while ($rows2 = mysqli_fetch_assoc($result2)) {
            $id2 = $rows2['post_id'];
        }
    }

    $query5 = "INSERT INTO `webproject`.`post_img` (post_id, img_url) VALUES ('$id2', '$image_name')";
    $result5 = mysqli_query($conn, $query5) or die(mysqli_error($conn));

    if ($result5 == True) {
        $_SESSION["add"] = "News successfully posted";
    } else {
        $_SESSION["add"] = $image_name . " failed to add";
    }


    if (isset($_SESSION['add'])) {
        echo "<script>alert('" . $_SESSION['add'] . "')</script>";
        unset($_SESSION['add']);
    }

    // Redirect to add-new-post.php
    header("Location: /admin/post.php");
    exit();
} else {
    echo "Button not clicked";
}


include("./parts/footer.php");
?>