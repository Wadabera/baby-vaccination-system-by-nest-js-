<?php include("./parts/header.php");
$id = $_GET['id'];

?>

<!--USER MODAL-->

<div class="modal-dialog modal-lg">
    <div class="modal-content">
        <div class="modal-header bg-warning text-white">
            <h5 class="modal-title">Update User</h5>
            <button class="close" data-dismiss="modal">
                <span>&times;</span>
            </button>
        </div>
        <?php
        if (isset($_SESSION['add'])) {
            echo "<script>alert('" . $_SESSION['add'] . "')</script>";
            unset($_SESSION['add']);
        }

        ?>

        <?php
        $query = "SELECT * FROM webproject.users where user_id='$id'";
        // echo $query;
        // die();
        $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
        $rows = mysqli_num_rows($result);
        if ($rows > 0) {
            while ($rows = mysqli_fetch_assoc($result)) {
                $username = $rows['username'];
                $rol = $rows['role'];
                $f_name = $rows['f_name'];
                $m_name = $rows["m_name"];
                $l_name = $rows['l_name'];
                $phone_number = $rows["phone_number"];
                $email = $rows['email'];
                $image_url = $rows['image_url'];

        ?>

                <form action='update_user_data.php' method='post' enctype='multipart/form-data' onsubmit="return validateForm()">
                    <div class="modal-body">

                        <div class="form-group">
                            <input type="hidden" class="form-control" name='id' value='<?php echo $id ?>' />
                        </div>
                        <div class="form-group">
                            <label for="name">First name</label>
                            <input type="text" class="form-control" name='f_name' value='<?php echo $f_name ?>' />
                        </div>

                        <div class="form-group">
                            <label for="name">Middle name</label>
                            <input type="text" name='m_name' value='<?php echo $m_name ?>' class="form-control" />
                        </div>

                        <div class="form-group">
                            <label for="name">Last name</label>
                            <input type="text" value='<?php echo $l_name ?>' name='l_name' class="form-control" />
                        </div>

                        <div class="form-group">
                            <label for="name">Username</label>
                            <input type="text" value='<?php echo $username ?>' name='username' class="form-control" />
                        </div>

                        <div class="form-group">
                            <label for="name">Role</label>
                            <select name="role" id="role" required>
                                <option value="admin" <?php if ($rol == 'admin') {
                                                            echo 'selected';
                                                        } ?>>admin</option>
                                <option value="registrar" <?php if ($rol == 'registrar') {
                                                                echo 'selected';
                                                            } ?>>registrar</option>
                                <option value="doctor" <?php if ($rol == 'doctor') {
                                                            echo 'selected';
                                                        } ?>>doctor</option>
                                <option value="mother" <?php if ($rol == 'mother') {
                                                            echo 'selected';
                                                        } ?>>mother</option>
                                <option value="guest" <?php if ($rol == 'guest') {
                                                            echo 'selected';
                                                        } ?>>guest</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="name">Phone number</label>
                            <input type="text" value='<?php echo $phone_number ?>' name='phone_number' class="form-control" pattern="^\+251\d{2}\d{3}\d{4}$" placeholder="+251-XX-XXX-XXXX" required />
                        </div>

                        <div class="form-group">
                            <label for="Email">Email</label>
                            <input type="email" value='<?php echo $email ?>' name='email' class="form-control" />
                        </div>
                <?php }
        } ?>
                <div class="modal-footer">
                    <label for=""><a href="users.php">Close</a></label>
                    <input type="submit" class="btn btn-warning" name='updateuser' value="Update">
                </div>

                    </div>
                </form>

                <script>
                    function validateForm() {
                        var firstName = document.getElementsByName('f_name')[0].value;
                        var middleName = document.getElementsByName('m_name')[0].value;
                        var lastName = document.getElementsByName('l_name')[0].value;
                        var username = document.getElementsByName('username')[0].value;
                        var phoneNumber = document.getElementsByName('phone_number')[0].value;
                        var email = document.getElementsByName('email')[0].value;

                        // Regular expressions for validation
                        var nameRegex = /^[A-Za-z]+$/;
                        var usernameRegex = /^[A-Za-z0-9]+$/;
                        // var phoneRegex = /^[0-9]+$/;
                        var emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

                        if (!nameRegex.test(firstName)) {
                            alert("Invalid first name");
                            return false;
                        }

                        if (!nameRegex.test(middleName)) {
                            alert("Invalid middle name");
                            return false;
                        }

                        if (!nameRegex.test(lastName)) {
                            alert("Invalid last name");
                            return false;
                        }

                        if (!usernameRegex.test(username)) {
                            alert("Invalid username");
                            return false;
                        }

                        if (!phoneRegex.test(phoneNumber)) {
                            alert("Invalid phone number");
                            return false;
                        }

                        if (!emailRegex.test(email)) {
                            alert("Invalid email");
                            return false;
                        }

                        return true;
                    }
                </script>

                <!--  Optional JavaScript -->
                <!-- jQuery first, then Popper.js, then Bootstrap JS -->
                <?php
                if (isset($_POST['updateuser'])) {
                    $username = $_POST['username'];
                    $role = $_POST['role'];
                    $f_name = $_POST['f_name'];
                    $m_name = $_POST["m_name"];
                    $l_name = $_POST['l_name'];
                    $phone_number = $_POST["phone_number"];
                    $email = $_POST['email'];
                    // $previesimg = $_POST['previesimg'];
                    // if(!isset($_FILES['image']['name'])){
                    //     $image_name = $previesimg;
                    // }
                    // else{
                    //     // moving the previes image
                    //     $sourceDirectory = '../images/users/';
                    //     $destinationDirectory = '../backup/image/users/';
                    //     $imageName =$previesimg;

                    //     $sourcePath = $sourceDirectory . $imageName;
                    //     $destinationPath = $destinationDirectory . $imageName;

                    //     // adding new image

                    //     $image_name = $_FILES['image']['name'];
                    //     $image_source = $_FILES['image']['tmp_name'];

                    //     // Get the file extension
                    //     $extension = pathinfo($image_name, PATHINFO_EXTENSION);

                    //     // Generate the new image name
                    //     $new_image_name =$f_name . $m_name . $lname . '.' . $extension;

                    //     $image_destination = "../images/users/" . $new_image_name;

                    //     $upload = move_uploaded_file($image_source, $image_destination);

                    //     if($uplode==FALSE){
                    //         $_SESSION["add"]="faile to upload image";
                    //         #header("Location:".HOMEURL."/admin/users.php");
                    //         die();
                    //     }

                    // }

                    $query = "UPDATE `webproject`.`users` SET
             f_name='$f_name', m_name='$m_name', 
             l_name='$l_name', username='$username', 
             phone_number='$phone_number', 
             email='$email', role='$role' where user_id='$id' ";
                    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

                    if ($result == True) {
                        $_SESSION["add"] = $username . " updated successfully";
                        #header("Location:".HOMEURL."admin/users.php");

                    } else {

                        $_SESSION["add"] = " failed to Update";
                        if (isset($_SESSION['add'])) {
                            echo "<script>alert('" . $_SESSION['add'] . "')</script>";
                            unset($_SESSION['add']);
                        }
                    }
                }

                include("./parts/footer.php") ?>