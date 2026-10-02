<?php
ob_start();  // Start output buffering

include('./parts/header.php');

if (isset($_POST['submit'])) {
    $m_id = $_POST['mother_id'];
    $f_name = $_POST['f_name'];
    $m_name = $_POST["m_name"];
    $l_name = $_POST['l_name'];
    $birthdate = $_POST['birthdate'];
    $blood_type = $_POST['blood_type'];

    $query = "INSERT INTO `webproject`.`child_table` 
    (m_id, f_name, m_name, l_name, bithdate, blood_type)
    VALUES
    ('$m_id', '$f_name', '$m_name', '$l_name', '$birthdate', '$blood_type')";

    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

    if ($result == True) {
        $query2 = "INSERT INTO webproject.child_vaccine (c_id, r1, r2, r3, r4, r5)
        VALUES (LAST_INSERT_ID(), 0, 0, 0, 0, 0)";
        $result2 = mysqli_query($conn, $query2) or die(mysqli_error($conn));

        if ($result2) {
            $_SESSION["add"] = $f_name . " successfully added";
            header("Location:" . HOMEURL . "registrar/children.php");
            exit();  // Stop further execution after header redirection
        }
    } else {
        $_SESSION["add"] = $f_name . " failed to be added";
        header("Location:" . HOMEURL . "registrar/add-child.php");
        exit();  // Stop further execution after header redirection
    }
} else {
    echo "Button not clicked";
}

ob_end_flush();  // End output buffering and send output
?>

<?php include("./parts/footer.php"); ?>
