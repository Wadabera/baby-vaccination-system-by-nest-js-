<?php

if(!isset($_SESSION['username'])){
    header('location:'.HOMEURL."/login.php");

}



?>