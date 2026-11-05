<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 *
 * Settings page (Setup → Plugins → {{name}}). Needs the CONFIG right.
 */

use GlpiPlugin\{{Key}}\Config;
use GlpiPlugin\{{Key}}\Profile;
use GlpiPlugin\{{Key}}\Ui;

include('../../../inc/includes.php');

Ui::need(Profile::CONFIG);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // GLPI 11 has already validated the CSRF token: calling Session::checkCSRF() here would consume it and fail.
    Config::save($_POST);
    Session::addMessageAfterRedirect(__('Settings saved.', '{{key}}'), false, INFO);
    Html::redirect(Ui::url('config')); // throws a RedirectException: nothing below runs
}

Ui::header('config', __('Settings', '{{key}}'));

echo "<form method='post' action='" . Ui::e(Ui::url('config')) . "'>" . Ui::csrf();
echo "<div class='card'><div class='card-header'><h3 class='card-title'><i class='ti ti-adjustments me-1'></i>"
    . Ui::e(__('Settings', '{{key}}')) . "</h3></div><div class='card-body'>";

echo "<div class='mb-3'><label class='form-label' for='example_text'>" . Ui::e(__('Example text', '{{key}}')) . "</label>"
    . "<input class='form-control' type='text' id='example_text' name='example_text' maxlength='255' value='" . Ui::e(Config::get('example_text')) . "'>"
    . "<div class='form-text'>" . Ui::e(__('Free text, stored as is.', '{{key}}')) . "</div></div>";

echo "<div class='mb-3'><label class='form-label' for='example_number'>" . Ui::e(__('Example number', '{{key}}')) . "</label>"
    . "<input class='form-control' type='number' id='example_number' name='example_number' min='1' max='1000' value='" . Config::int('example_number') . "'>"
    . "<div class='form-text'>" . Ui::e(__('Between 1 and 1000; values outside are clamped, non-numbers fall back to the default.', '{{key}}')) . "</div></div>";

// the hidden "0" makes an unticked box arrive as "0" instead of not arriving at all
echo "<input type='hidden' name='example_flag' value='0'>"
    . "<label class='form-check'><input class='form-check-input' type='checkbox' name='example_flag' value='1'" . (Config::flag('example_flag') ? ' checked' : '') . ">"
    . "<span class='form-check-label'>" . Ui::e(__('Example switch', '{{key}}')) . "</span></label>";

echo "</div><div class='card-footer text-end'><button class='btn btn-primary' type='submit'><i class='ti ti-device-floppy me-1'></i>"
    . Ui::e(_sx('button', 'Save')) . "</button></div></div>";
echo "</form>";

Ui::footer();
