<?php
include("./parts/header.php");
if (isset($_POST['updatemother'])) {
    $f_name = $_POST['f_name'];
    $m_name = $_POST["m_name"];
    $l_name = $_POST['l_name'];
    $birthdate = $_POST['birthdate'];
    $blood_type = $_POST['blood_type'];
    $phone_number = $_POST["phone_number"];
    $zone = $_POST['zone'];
    $wereda = $_POST['wereda'];
    $kebele = $_POST['kebele'];
    $id = $_POST['id'];


    $query = "UPDATE `webproject`.`mother_table` SET
    f_name='$f_name', m_name='$m_name', 
    l_name='$l_name', 
    bithdate='$birthdate', 
    blood_type='$blood_type',
    m_phone='$phone_number',
    zone ='$zone',
    wereda = '$wereda',
    kebele = '$kebele' WHERE m_id = '$id'";

    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

    if ($result == True) {
        $_SESSION["add"] = $f_name . " updated successfully";
        header("Location:" . HOMEURL . "registrar/mother.php");
    } else {

        $_SESSION["add"] = " failed to Update";
        if (isset($_SESSION['add'])) {
            echo "<h1 class='error'>" . $_SESSION['add'] . "</h1>";
            unset($_SESSION['add']);
        }
    }
}
?>

<?php
include("./parts/footer.php")
?>