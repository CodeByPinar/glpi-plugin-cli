<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 *
 * Item list: GLPI's search engine (criteria, columns, export, massive actions) on the plugin's table.
 */

use GlpiPlugin\{{Key}}\Item;
use GlpiPlugin\{{Key}}\Ui;

include('../../../inc/includes.php');

Ui::need(READ);
Ui::header('item', Item::getTypeName(2));

Search::show(Item::class);

Ui::footer();
