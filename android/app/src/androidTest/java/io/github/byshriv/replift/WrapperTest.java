package io.github.byshriv.replift;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Package/intent smoke checks; live OAuth, WebView data and upgrade need the documented device drill. */
@RunWith(AndroidJUnit4.class)
public class WrapperTest {
    @Test
    public void exactOAuthReturnRoutesToThisInstalledApp() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("io.github.byshriv.replift", context.getPackageName());
        Intent intent = new Intent(Intent.ACTION_VIEW,
            Uri.parse("io.github.byshriv.replift://oauth/dropbox?code=synthetic&state=synthetic"));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setPackage(context.getPackageName());
        assertNotNull(context.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY));
        intent.setData(Uri.parse("io.github.byshriv.replift://oauth/unrelated"));
        assertNull(context.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY));
    }
}
