<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 *
 * Item form: create, update, delete. GLPI posts the buttons of showFormButtons() here (add / update / purge).
 */

use GlpiPlugin\{{Key}}\Item;
use GlpiPlugin\{{Key}}\Ui;

include('../../../inc/includes.php');

$item = new Item();

if (isset($_POST['add'])) {
    $item->check(-1, CREATE, $_POST);
    $id = $item->add($_POST);
    if ($id && ($_SESSION['glpibackcreated'] ?? false)) {
        Html::redirect($item->getLinkURL());
    }
    Html::back();
} elseif (isset($_POST['update'])) {
    $item->check((int) $_POST['id'], UPDATE);
    $item->update($_POST);
    Html::back();
} elseif (isset($_POST['purge'])) {
    $item->check((int) $_POST['id'], PURGE);
    $item->delete($_POST, true);
    $item->redirectToList();
}

Ui::need(READ);
Ui::header('item', Item::getTypeName(1));

$item->display(['id' => (int) ($_GET['id'] ?? 0)]);

Ui::footer();
