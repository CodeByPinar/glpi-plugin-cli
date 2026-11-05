<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use CommonGLPI;
use Ticket;

/**
 * TicketTab — a "{{name}}" tab on every ticket (registered with Plugin::registerClass(…, ['addtabon' => 'Ticket'])).
 *
 * The same two methods add a tab to any item type: change 'Ticket' in setup.php and the instanceof checks here.
 * Signatures must stay exactly as GLPI declares them (no added parameter types).
 */
final class TicketTab extends CommonGLPI
{
    public static function getTypeName($nb = 0)
    {
        return '{{php_name}}';
    }

    public function getTabNameForItem(CommonGLPI $item, $withtemplate = 0)
    {
        if ($item instanceof Ticket && (int) $item->getID() > 0 && Profile::canRead()) {
            return self::createTabEntry(self::getTypeName(), 0, null, '{{icon}}');
        }
        return '';
    }

    public static function displayTabContentForItem(CommonGLPI $item, $tabnum = 1, $withtemplate = 0)
    {
        if (!$item instanceof Ticket) {
            return false;
        }
        echo "<div class='card'><div class='card-body'>";
        echo sprintf(Ui::e(__('Ticket #%d — the content of the {{php_name}} tab goes here.', '{{key}}')), (int) $item->getID());
        echo "</div></div>";
        return true;
    }
}
