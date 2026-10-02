<?php
include("../config/constant.php");
require_once('tcpdf/tcpdf.php');

class PDF extends TCPDF {
    // Page header
    public function Header() {
        Image('./logo.png', 10, -1, 70);
        $this->SetFont('Arial', 'B', 13);
        // Move to the right
        $this->Cell(80);
        // Title
        $this->Cell(80, 10, 'Mothers List', 1, 0, 'C');
        // Line break
        $this->Ln(20);
    }

    // Page footer
    public function Footer() {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        // Arial italic 8
        $this->SetFont('Arial', 'I', 8);
        // Page number
        $this->Cell(0, 10, 'Page '.$this->getAliasNumPage().'/'.$this->getAliasNbPages(), 0, 0, 'C');
    }
}

$db = new dbObj();
$connString = $db->getConnstring();
$display_heading = array('user_id' => 'ID', 'f_name' => 'Name', 'l_name' => 'last name', 'phone_number' => 'Phone');

$result = mysqli_query($connString, "SELECT * FROM webproject.users") or die("Database error: ".mysqli_error($connString));
$header = mysqli_query($connString, "SHOW COLUMNS FROM webproject.users");

$pdf = new PDF();
// Header
$pdf->AddPage();
// Footer
$pdf->AliasNbPages();
$pdf->SetFont('Arial', 'B', 12);

foreach ($header as $heading) {
    $pdf->Cell(40, 12, $display_heading[$heading['Field']], 1);
}

foreach ($result as $row) {
    $pdf->Ln();
    foreach ($row as $column) {
        $pdf->Cell(40, 12, $column, 1);
    }
}

$pdf->Output('report.pdf', 'I');
