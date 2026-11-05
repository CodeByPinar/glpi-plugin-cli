<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use CommonDBTM;
use Dropdown;
use Entity;
use Html;
use Log;
use Session;

/**
 * Item — an example item type backed by glpi_plugin_{{key}}_items: list through GLPI's search engine, standard
 * form, history, massive actions, entity restriction. Rename it (class, table, pages) to what your plugin manages.
 *
 * GLPI derives the table name from the class name: GlpiPlugin\{{Key}}\Item → glpi_plugin_{{key}}_items.
 */
class Item extends CommonDBTM
{
    public const TABLE = 'glpi_plugin_{{key}}_items';

    public function __construct()
    {
        parent::__construct();
        // Set here, not redeclared: CommonDBTM::$dohistory is untyped in GLPI 11 and `bool` in GLPI 12, and PHP
        // refuses to redeclare a property with a different type either way.
        $this->dohistory = true;
    }

    public static function getTypeName($nb = 0)
    {
        return _n('Item', 'Items', $nb, '{{key}}');
    }

    public static function getIcon()
    {
        return '{{icon}}';
    }

    // The rights go through Profile instead of static::$rightname: GLPI 11 declares that property without a type and
    // GLPI 12 as `string`, and PHP refuses to redeclare it either way in a class that must load on both.
    public static function canView(): bool
    {
        return Profile::has(READ);
    }

    public static function canCreate(): bool
    {
        return Profile::has(CREATE);
    }

    public static function canUpdate(): bool
    {
        return Profile::has(UPDATE);
    }

    public static function canDelete(): bool
    {
        return Profile::has(DELETE);
    }

    public static function canPurge(): bool
    {
        return Profile::has(PURGE);
    }

    public function defineTabs($options = [])
    {
        $tabs = [];
        $this->addDefaultFormTab($tabs);
        $this->addStandardTab(Log::class, $tabs, $options);
        return $tabs;
    }

    public function rawSearchOptions()
    {
        $table = self::getTable();
        $tab = [];
        $tab[] = ['id' => 'common', 'name' => self::getTypeName(2)];
        $tab[] = ['id' => 1, 'table' => $table, 'field' => 'name', 'name' => __('Name'), 'datatype' => 'itemlink', 'massiveaction' => false];
        $tab[] = ['id' => 2, 'table' => $table, 'field' => 'id', 'name' => __('ID'), 'datatype' => 'number', 'massiveaction' => false];
        $tab[] = ['id' => 3, 'table' => $table, 'field' => 'is_active', 'name' => __('Active'), 'datatype' => 'bool'];
        $tab[] = ['id' => 16, 'table' => $table, 'field' => 'comment', 'name' => __('Comments'), 'datatype' => 'text'];
        $tab[] = ['id' => 19, 'table' => $table, 'field' => 'date_mod', 'name' => __('Last update'), 'datatype' => 'datetime', 'massiveaction' => false];
        $tab[] = ['id' => 121, 'table' => $table, 'field' => 'date_creation', 'name' => __('Creation date'), 'datatype' => 'datetime', 'massiveaction' => false];
        $tab[] = ['id' => 80, 'table' => Entity::getTable(), 'field' => 'completename', 'name' => Entity::getTypeName(1), 'datatype' => 'dropdown', 'massiveaction' => false];
        $tab[] = ['id' => 86, 'table' => $table, 'field' => 'is_recursive', 'name' => __('Child entities'), 'datatype' => 'bool'];
        return $tab;
    }

    public function prepareInputForAdd($input)
    {
        return $this->cleanInput($input);
    }

    public function prepareInputForUpdate($input)
    {
        return $this->cleanInput($input);
    }

    /** @param array<string,mixed> $input @return array<string,mixed>|false */
    private function cleanInput($input)
    {
        if (array_key_exists('name', $input)) {
            $input['name'] = trim((string) $input['name']);
            if ($input['name'] === '') {
                Session::addMessageAfterRedirect(__('Name is required.', '{{key}}'), false, ERROR);
                return false;
            }
        }
        return $input;
    }

    public function showForm($ID, array $options = [])
    {
        $this->initForm($ID, $options);
        $this->showFormHeader($options);

        echo "<tr class='tab_bg_1'>";
        echo "<td><label for='name'>" . __('Name') . "</label></td><td>";
        echo Html::input('name', ['value' => $this->fields['name'], 'required' => true]);
        echo "</td><td>" . __('Active') . "</td><td>";
        Dropdown::showYesNo('is_active', $this->fields['is_active']);
        echo "</td></tr>";

        echo "<tr class='tab_bg_1'><td><label for='comment'>" . __('Comments') . "</label></td><td colspan='3'>";
        echo "<textarea class='form-control' id='comment' name='comment' rows='4'>" . Ui::e($this->fields['comment']) . "</textarea>";
        echo "</td></tr>";

        $this->showFormButtons($options);
        return true;
    }
}
