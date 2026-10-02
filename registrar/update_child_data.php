<?php
include("./parts/header.php");

if (isset($_POST['updatechild'])) {
    $f_name = $_POST['f_name'];
    $m_name = $_POST["m_name"];
    $l_name = $_POST['l_name'];
    $birthdate = $_POST['birthdate'];
    $blood_type = $_POST['blood_type'];
    $m_id =  $_POST['m_id'];
    $id = $_POST['id'];


    $query = "UPDATE `webproject`.`child_table` SET
              m_id = '$m_id',
             f_name='$f_name', m_name='$m_name', 
             l_name='$l_name', bithdate='$birthdate',
             blood_type='$blood_type' where
             c_id='$id' ";

    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

    if ($result == true) {
        $_SESSION["add"] = $f_name . " updated successfully";
        header("Location:" . HOMEURL . "/registrar/children.php");
    } else {
        $_SESSION["add"] = "Failed to update.";
        if (isset($_SESSION['add'])) {
            echo "<script>alert('" . $_SESSION['add'] . "')</script>";
            unset($_SESSION['add']);
        }
    }
}
